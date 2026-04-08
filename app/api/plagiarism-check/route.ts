import { NextResponse } from "next/server";
import { calculateSimilarityScore } from "@/lib/similarity";
import {
  calculateWebPlagiarismScore,
  getSentences,
  selectSentencesForWebCheck,
} from "@/lib/plagiarism";
import { createClient } from "@/lib/supabase/server";
import {
  getValidationErrorMessage,
  plagiarismCheckRequestSchema,
} from "@/lib/validation/schemas";
import * as cheerio from "cheerio";
import { createHash } from "node:crypto";

type SearchProviderName = "duckduckgo" | "bing";

type ProviderSearchResult = {
  provider: SearchProviderName;
  snippets: string[];
};

type SentenceWebCheckResult = {
  matched: boolean;
  successfulProviders: SearchProviderName[];
  failedProviders: SearchProviderName[];
};

type PlagiarismResponsePayload = {
  /** High value = output is structurally close to input = poor paraphrasing */
  structuralSimilarityToOriginal: number;
  webPlagiarismScore: { score: number; low: number; high: number };
  sampledSentenceCount: number;
  matchedSentenceCount: number;
  failedSentenceChecks: number;
  webCheckSource: "rewrittenText";
  webProvidersUsed: SearchProviderName[];
  webProvidersFailed: SearchProviderName[];
  sampleBased: true;
  degradedWebCheck: boolean;
  degradedReason: string | null;
  message: string;
};

type CacheEntry = {
  expiresAt: number;
  insertedAt: number;
  payload: PlagiarismResponsePayload;
};

const resultCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ITEMS = 500;

function cleanupCache(now: number) {
  for (const [key, entry] of resultCache.entries()) {
    if (entry.expiresAt <= now) {
      resultCache.delete(key);
    }
  }

  // Evict by the true oldest insertion timestamp instead of relying on Map order.
  while (resultCache.size > MAX_CACHE_ITEMS) {
    let oldestKey: string | null = null;
    let oldestInsertedAt = Number.POSITIVE_INFINITY;

    for (const [key, entry] of resultCache.entries()) {
      if (entry.insertedAt < oldestInsertedAt) {
        oldestInsertedAt = entry.insertedAt;
        oldestKey = key;
      }
    }

    if (!oldestKey) break;
    resultCache.delete(oldestKey);
    }
}

function buildCacheKey(userId: string, originalText: string, rewrittenText: string): string {
  return createHash("sha256")
    .update(userId)
    .update("|")
    .update(originalText)
    .update("|")
    .update(rewrittenText)
    .digest("hex");
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function calculateWordOverlapRatio(sentenceWords: string[], snippetWords: string[]): number {
  if (!sentenceWords.length) return 0;
  const snippetSet = new Set(snippetWords);
  let matches = 0;
  for (const word of sentenceWords) {
    if (snippetSet.has(word)) matches++;
  }
  return matches / sentenceWords.length;
}

const SEARCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

function hasAntiBotContent(html: string): boolean {
  const htmlLower = html.toLowerCase();
  return (
    htmlLower.includes("unusual traffic") ||
    htmlLower.includes("captcha") ||
    htmlLower.includes("automated requests") ||
    htmlLower.includes("verify you are human")
  );
}

async function searchDuckDuckGo(query: string): Promise<ProviderSearchResult> {
  // Use DuckDuckGo's JSON API to avoid anti-bot HTML challenge pages.
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: SEARCH_HEADERS,
  });

  if (!response.ok) {
    // Tag provider on errors so attribution remains robust.
    throw Object.assign(new Error(`DuckDuckGo failed with status ${response.status}`), {
      provider: "duckduckgo" as const,
    });
  }

  const data = (await response.json()) as {
    Abstract?: string;
    AbstractText?: string;
    RelatedTopics?: Array<{ Text?: string; Topics?: Array<{ Text?: string }> }>;
    Results?: Array<{ Text?: string }>;
  };

  const snippets: string[] = [];

  if (data.Abstract) snippets.push(data.Abstract);
  if (data.AbstractText) snippets.push(data.AbstractText);

  data.Results?.forEach((result) => {
    if (result.Text) snippets.push(result.Text);
  });

  data.RelatedTopics?.forEach((topic) => {
    if (topic.Text) snippets.push(topic.Text);
    topic.Topics?.forEach((subTopic) => {
      if (subTopic.Text) snippets.push(subTopic.Text);
    });
  });

  const normalizedSnippets = snippets
    .map((snippet) => snippet.trim())
    .filter((snippet) => snippet.length > 0);

  return { provider: "duckduckgo", snippets: normalizedSnippets };
}

async function searchBing(query: string): Promise<ProviderSearchResult> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=en-US`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: SEARCH_HEADERS,
  });

  if (!response.ok) {
    // Tag provider on errors so attribution remains robust.
    throw Object.assign(new Error(`Bing failed: ${response.status}`), {
      provider: "bing" as const,
    });
  }

  const html = await response.text();
  if (hasAntiBotContent(html)) {
    // Tag provider on errors so attribution remains robust.
    throw Object.assign(new Error("Bing anti-bot challenge encountered"), {
      provider: "bing" as const,
    });
  }

  const $ = cheerio.load(html);
  const snippets: string[] = [];
  const selectors = ["li.b_algo .b_caption p", "li.b_algo p", "[class*='b_caption'] p"];
  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const text = $(el).text().trim();
      if (text) snippets.push(text);
    });
    if (snippets.length > 0) break;
  }

  return { provider: "bing", snippets };
}

async function checkSentenceOnWeb(sentence: string): Promise<SentenceWebCheckResult> {
  const sentenceWords = sentence.split(/\s+/).filter(Boolean);
  const query = sentenceWords.slice(0, 14).join(" ");

  // Restrict provider set to DuckDuckGo and Bing for more predictable behavior.
  const providerCalls: Array<Promise<ProviderSearchResult>> = [searchDuckDuckGo(query), searchBing(query)];

  const providerResults = await Promise.allSettled(providerCalls);

  const successfulProviders: SearchProviderName[] = [];
  const failedProviders: SearchProviderName[] = [];
  const snippets: string[] = [];

  for (const result of providerResults) {
    if (result.status === "fulfilled") {
      successfulProviders.push(result.value.provider);
      snippets.push(...result.value.snippets);
      continue;
    }

    // Read provider directly from tagged error metadata instead of brittle message parsing.
    const provider = (result.reason as { provider?: SearchProviderName })?.provider ?? "duckduckgo";
    failedProviders.push(provider);
  }

  if (successfulProviders.length === 0) {
    throw new Error("All search providers failed for this sentence");
  }

  if (snippets.length === 0) {
    return {
      matched: false,
      successfulProviders,
      failedProviders,
    };
  }

  const targetWords = normalizeWords(sentence);
  const exactNormalizedSentence = targetWords.join(" ");
  const importantWords = targetWords.filter((word) => word.length > 4);

  let bestOverlap = 0;
  for (const snippet of snippets) {
    const snippetWords = normalizeWords(snippet);
    const overlap = calculateWordOverlapRatio(targetWords, snippetWords);
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
    }

    // Strong phrase evidence inside a snippet is a likely copy signal.
    const snippetNormalized = snippetWords.join(" ");
    if (exactNormalizedSentence.length > 20 && snippetNormalized.includes(exactNormalizedSentence.slice(0, 50))) {
      return {
        matched: true,
        successfulProviders,
        failedProviders,
      };
    }

    // Sensitive fallback: enough shared important words in one snippet can indicate likely source overlap.
    const sharedImportantWords = importantWords.filter((word) => snippetWords.includes(word));
    if (sharedImportantWords.length >= 4 && overlap >= 0.2) {
      return {
        matched: true,
        successfulProviders,
        failedProviders,
      };
    }
  }

  return {
    matched: bestOverlap >= 0.25,
    successfulProviders,
    failedProviders,
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to run plagiarism checks." },
        { status: 401 }
      );
    }

    const payload = await request.json();
    const parsedPayload = plagiarismCheckRequestSchema.safeParse(payload);
    if (!parsedPayload.success) {
      return NextResponse.json(
        { error: getValidationErrorMessage(parsedPayload.error) },
        { status: 400 }
      );
    }

    const {
      originalText: normalizedOriginalText,
      rewrittenText: normalizedRewrittenText,
    } = parsedPayload.data;

    const now = Date.now();
    cleanupCache(now);

    const cacheKey = buildCacheKey(user.id, normalizedOriginalText, normalizedRewrittenText);
    const cached = resultCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return NextResponse.json({
        ...cached.payload,
        cacheHit: true,
      });
    }

    // 1. Structural Similarity (Is the grammar/flow exactly the same?)
    const structureScore = calculateSimilarityScore(normalizedOriginalText, normalizedRewrittenText);
    
    // 2. Web check based on sampled sentences from the rewritten text.
    const sentences = getSentences(normalizedRewrittenText);
    // Keep score shape stable even when no sentences are sampled.
    let webPlagiarismScore = calculateWebPlagiarismScore(0, 0);
    let foundMatches = 0;
    let failedSentenceChecks = 0;
    let sampledSentenceCount = 0;
    const providersUsed = new Set<SearchProviderName>();
    const providersFailed = new Set<SearchProviderName>();

    if (sentences.length > 0) {
      const sentencesToCheck = selectSentencesForWebCheck(sentences);
      sampledSentenceCount = sentencesToCheck.length;

      const results = await Promise.allSettled(
        sentencesToCheck.map((sentence) => checkSentenceOnWeb(sentence))
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          for (const provider of result.value.successfulProviders) {
            providersUsed.add(provider);
          }
          for (const provider of result.value.failedProviders) {
            providersFailed.add(provider);
          }

          if (result.value.matched) {
            foundMatches++;
          }
        } else {
          failedSentenceChecks++;
        }
      }

      webPlagiarismScore = calculateWebPlagiarismScore(foundMatches, sampledSentenceCount);
    }

    const degradedWebCheck = failedSentenceChecks > 0;
    // Surface degraded provider state directly in API text so users can trust score context.
    const responseMessage = degradedWebCheck
      ? `Warning: plagiarism check was incomplete - ${providersFailed.size} provider(s) failed (${Array.from(providersFailed).join(", ")}). Results are based on ${providersUsed.size} provider(s) only and may underestimate match risk. Fix provider errors and recheck before submitting.`
      : "Plagiarism check completed using sampled sentence analysis. This is an indicator, not a definitive plagiarism verdict.";

    const responsePayload: PlagiarismResponsePayload = {
      structuralSimilarityToOriginal: structureScore,
        webPlagiarismScore,
        sampledSentenceCount,
        matchedSentenceCount: foundMatches,
        failedSentenceChecks,
        webCheckSource: "rewrittenText",
        webProvidersUsed: Array.from(providersUsed),
        webProvidersFailed: Array.from(providersFailed),
        sampleBased: true,
        degradedWebCheck,
        // Provide a compact machine-readable reason for degraded provider coverage.
        degradedReason: degradedWebCheck ? `Failed providers: ${Array.from(providersFailed).join(", ")}` : null,
        message: responseMessage,
    };

    resultCache.set(cacheKey, {
      expiresAt: now + CACHE_TTL_MS,
      // Track insertion time so eviction can remove the actual oldest cache entry.
      insertedAt: now,
      payload: responsePayload,
    });

    return NextResponse.json({
      ...responsePayload,
      cacheHit: false,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Plagiarism API caught error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
