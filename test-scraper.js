/* eslint-disable @typescript-eslint/no-require-imports */
const cheerio = require('cheerio');

async function test() {
  const sentence = "Artificial intelligence was founded as an academic discipline in 1956.";
  const query = sentence;
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
  });
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  let exactMatches = 0;
  
  $('.result__snippet').each((_, el) => {
     const text = $(el).text();
     // Fuzzy/exact match logic across the snippet
     if (text.toLowerCase().includes("founded as an academic discipline")) {
         exactMatches++;
     }
  });
  
  console.log("HTML length:", html.length);
  console.log("Snippet count:", $('.result__snippet').length);
  console.log("Exact matches found in snippets:", exactMatches);
}

test();
