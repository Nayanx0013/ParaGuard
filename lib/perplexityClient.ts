/**
 * perplexityClient: External verification for text unpredictability.
 */

export type PerplexityResult = {
  score: number;
  normalized: number;
  label: string;
};

const CACHE = new Map<string, PerplexityResult>();
const MAX_CACHE_SIZE = 100;

/**
 * scorePerplexity: Evaluates the complexity of text.
 */
export async function scorePerplexity(text: string): Promise<PerplexityResult | null> {
  const url = process.env.NEXT_PUBLIC_HF_SPACES_URL;
  if (!url || !text || text.length < 10) return null;

  if (CACHE.has(text)) return CACHE.get(text) || null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}/perplexity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const data = await response.json();
    
    const result: PerplexityResult = {
      score: data.perplexity || 0,
      normalized: Math.min(100, Math.round((data.perplexity || 0) / 3)), 
      label: data.label || 'unknown'
    };

    if (CACHE.size >= MAX_CACHE_SIZE) {
      const firstKey = CACHE.keys().next().value;
      if (firstKey) CACHE.delete(firstKey);
    }
    CACHE.set(text, result);

    return result;
  } catch {
    return null;
  }
}