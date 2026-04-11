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
import { createHash } from "node:crypto";

type SearchProviderName = "serper" | "searlo" | "tavily" | "duckduckgo";

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

// ─── Quota tracker ────────────────────────────────────────────────────────────
type QuotaState = {
  exhausted: boolean;
  resetAt: number;
};

const providerQuota: Record<SearchProviderName, QuotaState> = {
  serper:     { exhausted: false, resetAt: 0 },
  searlo:     { exhausted: false, resetAt: 0 },
  tavily:     { exhausted: false, resetAt: 0 },
  duckduckgo: { exhausted: false, resetAt: 0 },
};

const QUOTA_BACKOFF_MS = 60 * 60 * 1000; // 1 hour

function markProviderExhausted(provider: SearchProviderName) {
  providerQuota[provider].exhausted = true;
  providerQuota[provider].resetAt = Date.now() + QUOTA_BACKOFF_MS;
  console.warn(
    `[plagiarism] "${provider}" quota exhausted — skipping until ${new Date(providerQuota[provider].resetAt).toISOString()}`
  );
}

function isProviderAvailable(provider: SearchProviderName): boolean {
  const state = providerQuota[provider];
  if (!state.exhausted) return true;
  if (Date.now() >= state.resetAt) {
    state.exhausted = false;
    state.resetAt = 0;
    console.info(`[plagiarism] "${provider}" quota reset — retrying.`);
    return true;
  }
  return false;
}

function isQuotaError(status: number): boolean {
  return status === 429 || status === 402;
}

// ─── Cache ────────────────────────────────────────────────────────────────────
const resultCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ITEMS = 500;

function cleanupCache(now: number) {
  for (const [key, entry] of resultCache.entries()) {
    if (entry.expiresAt <= now) resultCache.delete(key);
  }
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

function buildCacheKey(
  userId: string,
  originalText: string,
  rewrittenText: string
): string {
  return createHash("sha256")
    .update(userId)
    .update("|")
    .update(originalText)
    .update("|")
    .update(rewrittenText)
    .digest("hex");
}

// ─── Text helpers ─────────────────────────────────────────────────────────────
function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function calculateWordOverlapRatio(
  sentenceWords: string[],
  snippetWords: string[]
): number {
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

// ─── Provider 1: Serper ───────────────────────────────────────────────────────
async function searchSerper(query: string): Promise<ProviderSearchResult> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey || !isProviderAvailable("serper")) {
    throw Object.assign(
      new Error("Serper unavailable or quota exhausted"),
      { provider: "serper" as const, skipLog: true }
    );
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, num: 10 }),
    signal: AbortSignal.timeout(10000),
  });

  if (isQuotaError(response.status)) {
    markProviderExhausted("serper");
    throw Object.assign(
      new Error(`Serper quota exhausted (${response.status})`),
      { provider: "serper" as const }
    );
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`Serper error: ${response.status}`),
      { provider: "serper" as const }
    );
  }

  const data = (await response.json()) as {
    organic?: Array<{ snippet?: string; title?: string }>;
    answerBox?: { snippet?: string; answer?: string };
    knowledgeGraph?: { description?: string };
  };

  const snippets: string[] = [];
  if (data.answerBox?.snippet) snippets.push(data.answerBox.snippet);
  if (data.answerBox?.answer) snippets.push(data.answerBox.answer);
  if (data.knowledgeGraph?.description) snippets.push(data.knowledgeGraph.description);
  data.organic?.forEach((r) => {
    if (r.snippet) snippets.push(r.snippet);
    if (r.title) snippets.push(r.title);
  });

  return {
    provider: "serper",
    snippets: snippets.map((s) => s.trim()).filter(Boolean),
  };
}

// ─── Provider 2: Searlo ───────────────────────────────────────────────────────
async function searchSearlo(query: string): Promise<ProviderSearchResult> {
  const apiKey = process.env.SEARLO_API_KEY;
  if (!apiKey || !isProviderAvailable("searlo")) {
    throw Object.assign(
      new Error("Searlo unavailable or quota exhausted"),
      { provider: "searlo" as const, skipLog: true }
    );
  }

  const response = await fetch(
    `https://api.searlo.tech/search?q=${encodeURIComponent(query)}&num=10`,
    {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (isQuotaError(response.status)) {
    markProviderExhausted("searlo");
    throw Object.assign(
      new Error(`Searlo quota exhausted (${response.status})`),
      { provider: "searlo" as const }
    );
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`Searlo error: ${response.status}`),
      { provider: "searlo" as const }
    );
  }

  const data = (await response.json()) as {
    organic_results?: Array<{ snippet?: string; title?: string }>;
    answer_box?: { snippet?: string; answer?: string };
    featured_snippet?: { content?: string };
  };

  const snippets: string[] = [];
  if (data.answer_box?.snippet) snippets.push(data.answer_box.snippet);
  if (data.answer_box?.answer) snippets.push(data.answer_box.answer);
  if (data.featured_snippet?.content) snippets.push(data.featured_snippet.content);
  data.organic_results?.forEach((r) => {
    if (r.snippet) snippets.push(r.snippet);
    if (r.title) snippets.push(r.title);
  });

  return {
    provider: "searlo",
    snippets: snippets.map((s) => s.trim()).filter(Boolean),
  };
}

// ─── Provider 3: Tavily ───────────────────────────────────────────────────────
async function searchTavily(query: string): Promise<ProviderSearchResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey || !isProviderAvailable("tavily")) {
    throw Object.assign(
      new Error("Tavily unavailable or quota exhausted"),
      { provider: "tavily" as const, skipLog: true }
    );
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: "basic",
      max_results: 10,
      include_answer: false,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (isQuotaError(response.status)) {
    markProviderExhausted("tavily");
    throw Object.assign(
      new Error(`Tavily quota exhausted (${response.status})`),
      { provider: "tavily" as const }
    );
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`Tavily error: ${response.status}`),
      { provider: "tavily" as const }
    );
  }

  const data = (await response.json()) as {
    results?: Array<{ content?: string; title?: string }>;
    answer?: string;
  };

  const snippets: string[] = [];
  if (data.answer) snippets.push(data.answer);
  data.results?.forEach((r) => {
    if (r.content) snippets.push(r.content);
    if (r.title) snippets.push(r.title);
  });

  return {
    provider: "tavily",
    snippets: snippets.map((s) => s.trim()).filter(Boolean),
  };
}

// ─── Provider 4: DuckDuckGo ───────────────────────────────────────────────────
async function searchDuckDuckGo(query: string): Promise<ProviderSearchResult> {
  if (!isProviderAvailable("duckduckgo")) {
    throw Object.assign(
      new Error("DuckDuckGo temporarily unavailable"),
      { provider: "duckduckgo" as const }
    );
  }

  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
    headers: SEARCH_HEADERS,
  });

  if (!response.ok) {
    throw Object.assign(
      new Error(`DuckDuckGo error: ${response.status}`),
      { provider: "duckduckgo" as const }
    );
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
  data.Results?.forEach((r) => { if (r.Text) snippets.push(r.Text); });
  data.RelatedTopics?.forEach((t) => {
    if (t.Text) snippets.push(t.Text);
    t.Topics?.forEach((st) => { if (st.Text) snippets.push(st.Text); });
  });

  return {
    provider: "duckduckgo",
    snippets: snippets.map((s) => s.trim()).filter(Boolean),
  };
}

// ─── Fallback chain ───────────────────────────────────────────────────────────
async function searchWithFallback(query: string): Promise<ProviderSearchResult> {
  const providers: Array<() => Promise<ProviderSearchResult>> = [
    () => searchSerper(query),
    () => searchSearlo(query),
    () => searchTavily(query),
    () => searchDuckDuckGo(query),
  ];

  let lastError: Error | null = null;

  for (const providerFn of providers) {
    try {
      return await providerFn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const provider = (err as { provider?: SearchProviderName })?.provider ?? "unknown";
      const skipLog = (err as { skipLog?: boolean })?.skipLog;
      if (!skipLog) {
        console.warn(
          `[plagiarism] "${provider}" failed → trying next. Reason: ${lastError.message}`
        );
      }
    }
  }

  throw new Error(
    `All search providers exhausted. Last error: ${lastError?.message}`
  );
}

// ─── Sentence web check ───────────────────────────────────────────────────────
async function checkSentenceOnWeb(
  sentence: string
): Promise<SentenceWebCheckResult> {
  const sentenceWords = sentence.split(/\s+/).filter(Boolean);
  const query = sentenceWords.slice(0, 14).join(" ");

  let result: ProviderSearchResult;
  try {
    result = await searchWithFallback(query);
  } catch {
    throw new Error("All search providers failed for this sentence");
  }

  const successfulProviders: SearchProviderName[] = [result.provider];
  const failedProviders: SearchProviderName[] = [];
  const { snippets } = result;

  if (snippets.length === 0) {
    return { matched: false, successfulProviders, failedProviders };
  }

  const targetWords = normalizeWords(sentence);
  const exactNormalizedSentence = targetWords.join(" ");

  // Only flag important/distinctive words (length > 5 filters out common short words)
  const importantWords = targetWords.filter((word) => word.length > 5);

  let bestOverlap = 0;
  for (const snippet of snippets) {
    const snippetWords = normalizeWords(snippet);
    const overlap = calculateWordOverlapRatio(targetWords, snippetWords);
    if (overlap > bestOverlap) bestOverlap = overlap;

    // FIXED: Only match if 50+ char phrase found verbatim in snippet
    const snippetNormalized = snippetWords.join(" ");
    if (
      exactNormalizedSentence.length > 50 &&
      snippetNormalized.includes(exactNormalizedSentence.slice(0, 50))
    ) {
      return { matched: true, successfulProviders, failedProviders };
    }

    // FIXED: Raised from 4 shared words + 20% overlap → 6 shared words + 55% overlap
    const sharedImportantWords = importantWords.filter((w) =>
      snippetWords.includes(w)
    );
    if (sharedImportantWords.length >= 6 && overlap >= 0.55) {
      return { matched: true, successfulProviders, failedProviders };
    }
  }

  // FIXED: Raised final threshold from 0.25 → 0.6 to eliminate false positives
  return {
    matched: bestOverlap >= 0.6,
    successfulProviders,
    failedProviders,
  };
}

// ─── POST Handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error:
            "Authentication required. Please sign in to run plagiarism checks.",
        },
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

    const cacheKey = buildCacheKey(
      user.id,
      normalizedOriginalText,
      normalizedRewrittenText
    );
    const cached = resultCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return NextResponse.json({ ...cached.payload, cacheHit: true });
    }

    // 1. Structural similarity
    const structureScore = calculateSimilarityScore(
      normalizedOriginalText,
      normalizedRewrittenText
    );

    // 2. Web plagiarism check on sampled sentences
    const sentences = getSentences(normalizedRewrittenText);
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
          for (const p of result.value.successfulProviders) providersUsed.add(p);
          for (const p of result.value.failedProviders) providersFailed.add(p);
          if (result.value.matched) foundMatches++;
        } else {
          failedSentenceChecks++;
        }
      }

      webPlagiarismScore = calculateWebPlagiarismScore(
        foundMatches,
        sampledSentenceCount
      );
    }

    const degradedWebCheck = failedSentenceChecks > sampledSentenceCount / 2;

    const responseMessage = degradedWebCheck
      ? `Warning: plagiarism check was incomplete — ${providersFailed.size} provider(s) failed. Results may underestimate match risk.`
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
      degradedReason: degradedWebCheck
        ? `Failed providers: ${Array.from(providersFailed).join(", ")}`
        : null,
      message: responseMessage,
    };

    resultCache.set(cacheKey, {
      expiresAt: now + CACHE_TTL_MS,
      insertedAt: now,
      payload: responsePayload,
    });

    return NextResponse.json({ ...responsePayload, cacheHit: false });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("Plagiarism API caught error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}