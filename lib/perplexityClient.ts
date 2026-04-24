/**
 * perplexityClient: External verification for text unpredictability.
 * Connects to HuggingFace Spaces.
 */

const CACHE = new Map<string, any>();
const MAX_CACHE_SIZE = 100;

export type PerplexityResult = {
  score: number;
  normalized: number;
  label: string;
};

/**
 * scorePerplexity: Evaluates the complexity of text.
 * 
 * @param text - Input text for analysis.
 * @returns PerplexityResult or null if the request fails/times out.
 */
export async function scorePerplexity(text: string): Promise<PerplexityResult | null> {
  const url = process.env.NEXT_PUBLIC_HF_SPACES_URL;
  if (!url || !text || text.length < 10) return null;

  // 1. Check Local Cache
  if (CACHE.has(text)) return CACHE.get(text);

  try {
    // 2. Setup 5s Timeout Protection
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

    // 3. Update Cache with FIFO eviction
    if (CACHE.size >= MAX_CACHE_SIZE) {
      const firstKey = CACHE.keys().next().value;
      if (firstKey) CACHE.delete(firstKey);
    }
    CACHE.set(text, result);

    return result;
  } catch (error) {
    // Graceful failure as per requirements
    return null;
  }
}