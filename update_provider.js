/* eslint-disable */
const fs = require('fs');
const filePath = 'app/api/plagiarism-check/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /const data = \(await response\.json\(\)\) as \{\n    organic\?: Array<\{ snippet\?: string; title\?: string \}>;\n    answerBox\?: \{ snippet\?: string; answer\?: string \};\n    knowledgeGraph\?: \{ description\?: string \};\n  \};\n\n  const snippets: string\[\] = \[\];\n  if \(data\.answerBox\?\.snippet\) snippets\.push\(data\.answerBox\.snippet\);\n  if \(data\.answerBox\?\.answer\) snippets\.push\(data\.answerBox\.answer\);\n  if \(data\.knowledgeGraph\?\.description\) snippets\.push\(data\.knowledgeGraph\.description\);\n  data\.organic\?\.forEach\(\(r\) => \{\n    if \(r\.snippet\) snippets\.push\(r\.snippet\);\n    if \(r\.title\) snippets\.push\(r\.title\);\n  \}\);\n\n  return \{\n    provider: "serper",\n    snippets: snippets\.map\(\(s\) => s\.trim\(\)\)\.filter\(Boolean\),\n  \};/g,
  `const data = (await response.json()) as {
    organic?: Array<{ snippet?: string; title?: string; link?: string }>;
    answerBox?: { snippet?: string; answer?: string; link?: string };
    knowledgeGraph?: { description?: string; descriptionUrl?: string };
  };

  const snippets: Array<{snippet: string, url: string}> = [];
  if (data.answerBox?.snippet) snippets.push({ snippet: data.answerBox.snippet, url: data.answerBox.link || "" });
  if (data.answerBox?.answer) snippets.push({ snippet: data.answerBox.answer, url: data.answerBox.link || "" });
  if (data.knowledgeGraph?.description) snippets.push({ snippet: data.knowledgeGraph.description, url: data.knowledgeGraph.descriptionUrl || "" });
  data.organic?.forEach((r) => {
    if (r.snippet) snippets.push({ snippet: r.snippet, url: r.link || "" });
    if (r.title) snippets.push({ snippet: r.title, url: r.link || "" });
  });

  return {
    provider: "serper",
    snippets: snippets.filter((s) => s.snippet.trim().length > 0),
  };`
);

content = content.replace(
  /const data = \(await response\.json\(\)\) as \{\n    organic_results\?: Array<\{ snippet\?: string; title\?: string \}>;\n    answer_box\?: \{ snippet\?: string; answer\?: string \};\n    featured_snippet\?: \{ content\?: string \};\n  \};\n\n  const snippets: string\[\] = \[\];\n  if \(data\.answer_box\?\.snippet\) snippets\.push\(data\.answer_box\.snippet\);\n  if \(data\.answer_box\?\.answer\) snippets\.push\(data\.answer_box\.answer\);\n  if \(data\.featured_snippet\?\.content\) snippets\.push\(data\.featured_snippet\.content\);\n  data\.organic_results\?\.forEach\(\(r\) => \{\n    if \(r\.snippet\) snippets\.push\(r\.snippet\);\n    if \(r\.title\) snippets\.push\(r\.title\);\n  \}\);\n\n  return \{\n    provider: "searlo",\n    snippets: snippets\.map\(\(s\) => s\.trim\(\)\)\.filter\(Boolean\),\n  \};/g,
  `const data = (await response.json()) as {
    organic_results?: Array<{ snippet?: string; title?: string; link?: string }>;
    answer_box?: { snippet?: string; answer?: string; link?: string };
    featured_snippet?: { content?: string; url?: string };
  };

  const snippets: Array<{snippet: string, url: string}> = [];
  if (data.answer_box?.snippet) snippets.push({ snippet: data.answer_box.snippet, url: data.answer_box.link || "" });
  if (data.answer_box?.answer) snippets.push({ snippet: data.answer_box.answer, url: data.answer_box.link || "" });
  if (data.featured_snippet?.content) snippets.push({ snippet: data.featured_snippet.content, url: data.featured_snippet.url || "" });
  data.organic_results?.forEach((r) => {
    if (r.snippet) snippets.push({ snippet: r.snippet, url: r.link || "" });
    if (r.title) snippets.push({ snippet: r.title, url: r.link || "" });
  });

  return {
    provider: "searlo",
    snippets: snippets.filter((s) => s.snippet.trim().length > 0),
  };`
);

content = content.replace(
  /const data = \(await response\.json\(\)\) as \{\n    results\?: Array<\{ content\?: string; title\?: string \}>;\n    answer\?: string;\n  \};\n\n  const snippets: string\[\] = \[\];\n  if \(data\.answer\) snippets\.push\(data\.answer\);\n  data\.results\?\.forEach\(\(r\) => \{\n    if \(r\.content\) snippets\.push\(r\.content\);\n    if \(r\.title\) snippets\.push\(r\.title\);\n  \}\);\n\n  return \{\n    provider: "tavily",\n    snippets: snippets\.map\(\(s\) => s\.trim\(\)\)\.filter\(Boolean\),\n  \};/g,
  `const data = (await response.json()) as {
    results?: Array<{ content?: string; title?: string; url?: string }>;
    answer?: string;
  };

  const snippets: Array<{snippet: string, url: string}> = [];
  if (data.answer) snippets.push({ snippet: data.answer, url: "" });
  data.results?.forEach((r) => {
    if (r.content) snippets.push({ snippet: r.content, url: r.url || "" });
    if (r.title) snippets.push({ snippet: r.title, url: r.url || "" });
  });

  return {
    provider: "tavily",
    snippets: snippets.filter((s) => s.snippet.trim().length > 0),
  };`
);

content = content.replace(
  /const data = \(await response\.json\(\)\) as \{\n    Abstract\?: string;\n    AbstractText\?: string;\n    RelatedTopics\?: Array<\{\n      Text\?: string;\n      Topics\?: Array<\{ Text\?: string \}>;\n    \}>;\n    Results\?: Array<\{ Text\?: string \}>;\n  \};\n\n  const snippets: string\[\] = \[\];\n  if \(data\.Abstract\) snippets\.push\(data\.Abstract\);\n  if \(data\.AbstractText\) snippets\.push\(data\.AbstractText\);\n\n  data\.Results\?\.forEach\(\(r\) => \{\n    if \(r\.Text\) snippets\.push\(r\.Text\);\n  \}\);\n  data\.RelatedTopics\?\.forEach\(\(t\) => \{\n    if \(t\.Text\) snippets\.push\(t\.Text\);\n    t\.Topics\?\.forEach\(\(st\) => \{\n      if \(st\.Text\) snippets\.push\(st\.Text\);\n    \}\);\n  \}\);\n\n  return \{\n    provider: "duckduckgo",\n    snippets: snippets\.map\(\(s\) => s\.trim\(\)\)\.filter\(Boolean\),\n  \};/g,
  `const data = (await response.json()) as {
    Abstract?: string;
    AbstractText?: string;
    AbstractURL?: string;
    RelatedTopics?: Array<{
      Text?: string;
      FirstURL?: string;
      Topics?: Array<{ Text?: string; FirstURL?: string }>;
    }>;
    Results?: Array<{ Text?: string; FirstURL?: string }>;
  };

  const snippets: Array<{snippet: string, url: string}> = [];
  if (data.Abstract) snippets.push({ snippet: data.Abstract, url: data.AbstractURL || "" });
  if (data.AbstractText) snippets.push({ snippet: data.AbstractText, url: data.AbstractURL || "" });

  data.Results?.forEach((r) => {
    if (r.Text) snippets.push({ snippet: r.Text, url: r.FirstURL || "" });
  });
  data.RelatedTopics?.forEach((t) => {
    if (t.Text) snippets.push({ snippet: t.Text, url: t.FirstURL || "" });
    t.Topics?.forEach((st) => {
      if (st.Text) snippets.push({ snippet: st.Text, url: st.FirstURL || "" });
    });
  });

  return {
    provider: "duckduckgo",
    snippets: snippets.filter((s) => s.snippet.trim().length > 0),
  };`
);

content = content.replace(
  /const usedProviders = new Set<SearchProviderName>\(\);\n  const failedProviders = new Set<SearchProviderName>\(\);/g,
  `const usedProviders = new Set<SearchProviderName>();
  const failedProviders = new Set<SearchProviderName>();
  const matchedUrlsSet = new Set<string>();`
);

content = content.replace(
  /function checkSentenceOverlap\(\n  sentence: string,\n  results: ProviderSearchResult\[\]\n\): SentenceWebCheckResult \{\n  const targetWords = normalizeWords\(sentence\);\n  if \(targetWords\.length < 4\) \{\n    return \{ matched: false, successfulProviders: \[\], failedProviders: \[\], matchedUrls: \[\] \};\n  \}\n\n  const successfulProviders: SearchProviderName\[\] = \[\];\n  const failedProviders = new Set<SearchProviderName>\(\);\n\n  for \(const \{ provider, snippets \} of results\) \{\n    successfulProviders\.push\(provider\);\n\n    let bestOverlap = 0;\n    for \(const snippet of snippets\) \{\n      const snippetWords = normalizeWords\(snippet\);\n      const overlap = calculateWordOverlapRatio\(targetWords, snippetWords\);\n      if \(overlap > bestOverlap\) bestOverlap = overlap;\n    \}\n\n    if \(bestOverlap > 0\.4\) \{\n      return \{ matched: true, successfulProviders, failedProviders: Array\.from\(failedProviders\), matchedUrls: \[\] \};\n    \}\n  \}\n\n  return \{ matched: false, successfulProviders, failedProviders: Array\.from\(failedProviders\), matchedUrls: \[\] \};/g,
  `function checkSentenceOverlap(
  sentence: string,
  results: ProviderSearchResult[]
): SentenceWebCheckResult {
  const targetWords = normalizeWords(sentence);
  if (targetWords.length < 4) {
    return { matched: false, successfulProviders: [], failedProviders: [], matchedUrls: [] };
  }

  const successfulProviders: SearchProviderName[] = [];
  const failedProviders = new Set<SearchProviderName>();

  let highestOverlap = 0;
  const sentenceUrls = new Set<string>();

  for (const { provider, snippets } of results) {
    successfulProviders.push(provider);

    let bestLocalOverlap = 0;
    let bestLocalUrl = "";
    
    for (const { snippet, url } of snippets) {
      const snippetWords = normalizeWords(snippet);
      const overlap = calculateWordOverlapRatio(targetWords, snippetWords);
      if (overlap > bestLocalOverlap) {
        bestLocalOverlap = overlap;
        if (url && url.startsWith("http")) bestLocalUrl = url;
      }
    }

    if (bestLocalOverlap > highestOverlap) {
      highestOverlap = bestLocalOverlap;
    }
    if (bestLocalOverlap > 0.4 && bestLocalUrl) {
      sentenceUrls.add(bestLocalUrl);
    }
  }

  if (highestOverlap > 0.4) {
    return { matched: true, successfulProviders, failedProviders: Array.from(failedProviders), matchedUrls: Array.from(sentenceUrls) };
  }

  return { matched: false, successfulProviders, failedProviders: Array.from(failedProviders), matchedUrls: [] };`
);

content = content.replace(
  /res\.successfulProviders\.forEach\(\(p\) => usedProviders\.add\(p\)\);\n      res\.failedProviders\.forEach\(\(p\) => failedProviders\.add\(p\)\);\n\n      if \(res\.matched\) \{/g,
  `res.successfulProviders.forEach((p) => usedProviders.add(p));
      res.failedProviders.forEach((p) => failedProviders.add(p));
      if (res.matchedUrls && res.matchedUrls.length > 0) {
        res.matchedUrls.forEach((u) => matchedUrlsSet.add(u));
      }

      if (res.matched) {`
);

content = content.replace(
  /matchedUrls: \[\],\n      webCheckSource: "rewrittenText",/g,
  `matchedUrls: Array.from(matchedUrlsSet),
      webCheckSource: "rewrittenText",`
);

content = content.replace(
  /matchedUrls: \[\],\n    webCheckSource: "rewrittenText",/g,
  `matchedUrls: Array.from(matchedUrlsSet),
    webCheckSource: "rewrittenText",`
);

fs.writeFileSync(filePath, content);
console.log('Script complete');
