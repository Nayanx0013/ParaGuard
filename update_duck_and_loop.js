/* eslint-disable */
const fs = require('fs');
const filePath = 'app/api/plagiarism-check/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

// DuckDuckGo interface
content = content.replace(
  /RelatedTopics\?: Array<\{ Text\?: string; Topics\?: Array<\{ Text\?: string \}> \}>;    Results\?: Array<\{ Text\?: string \}>;/,
  `AbstractURL?: string;
    RelatedTopics?: Array<{ Text?: string; FirstURL?: string; Topics?: Array<{ Text?: string; FirstURL?: string }> }>;    Results?: Array<{ Text?: string; FirstURL?: string }>;`
);

// DuckDuckGo mapping
content = content.replace('if (data.Abstract) snippets.push(data.Abstract);', 'if (data.Abstract) snippets.push({ snippet: data.Abstract, url: data.AbstractURL || "" });');
content = content.replace('if (data.AbstractText) snippets.push(data.AbstractText);', 'if (data.AbstractText) snippets.push({ snippet: data.AbstractText, url: data.AbstractURL || "" });');
content = content.replace('data.Results?.forEach((r) => { if (r.Text) snippets.push(r.Text); });', 'data.Results?.forEach((r) => { if (r.Text) snippets.push({ snippet: r.Text, url: r.FirstURL || "" }); });');
content = content.replace('if (t.Text) snippets.push(t.Text);', 'if (t.Text) snippets.push({ snippet: t.Text, url: t.FirstURL || "" });');
content = content.replace('if (st.Text) snippets.push(st.Text);', 'if (st.Text) snippets.push({ snippet: st.Text, url: st.FirstURL || "" });');
content = content.replace('snippets: snippets.map((s) => s.trim()).filter(Boolean),', 'snippets: snippets.filter((s) => s.snippet.trim().length > 0),');
content = content.replace('const snippets: string[] = [];', 'const snippets: Array<{snippet: string, url: string}> = [];');


// checkSentenceOnWeb logic
content = content.replace(
  'return { matched: false, successfulProviders, failedProviders };',
  'return { matched: false, successfulProviders, failedProviders, matchedUrls: [] };'
);

content = content.replace(
  /let bestOverlap = 0;\n  for \(const snippet of snippets\) \{/,
  `let bestOverlap = 0;
  let matchingUrl = '';
  for (const {snippet, url} of snippets) {`
);

content = content.replace(
  /if \(overlap > bestOverlap\) bestOverlap = overlap;\n  \}/,
  `if (overlap > bestOverlap) { bestOverlap = overlap; if (url && url.startsWith("http")) matchingUrl = url; }
  }`
);

content = content.replace(
  'return { matched: true, successfulProviders, failedProviders };',
  'return { matched: true, successfulProviders, failedProviders, matchedUrls: bestOverlap > 0.4 && matchingUrl ? [matchingUrl] : [] };'
);

// Outer loop
content = content.replace(
  'const failedProviders = new Set<SearchProviderName>();',
  'const failedProviders = new Set<SearchProviderName>();\n  const matchedUrlsSet = new Set<string>();'
);

content = content.replace(
  /res\.failedProviders\.forEach\(\(p\) => failedProviders\.add\(p\)\);\n\n      if \(res\.matched\) \{/,
  `res.failedProviders.forEach((p) => failedProviders.add(p));
      if (res.matchedUrls && res.matchedUrls.length > 0) res.matchedUrls.forEach((u) => matchedUrlsSet.add(u));

      if (res.matched) {`
);

// Final return mapping
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
console.log('Provider update finished');
