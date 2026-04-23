export const MIN_WORDS_PER_SENTENCE = 6;
export const DEFAULT_SENTENCE_SAMPLE_SIZE = 5;

export function getSentences(text: string, minWords = MIN_WORDS_PER_SENTENCE): string[] {
  const rawSentences = text.split(/(?<=[.!?])\s+/);

  return rawSentences
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(/\s+/).length >= minWords);
}

export function selectSentencesForWebCheck(
  sentences: string[],
  sampleSize = DEFAULT_SENTENCE_SAMPLE_SIZE
): string[] {
  // Spread samples across the full text to reduce bias toward long filler sentences.
  if (sentences.length <= sampleSize) return sentences;
  const step = Math.floor(sentences.length / sampleSize);
  return Array.from({ length: sampleSize }, (_, i) => sentences[i * step]);
}

export function calculateWebPlagiarismScore(
  matches: number,
  sampled: number
): { score: number; low: number; high: number } {
  // Include a confidence band so small sample sizes do not look falsely precise.
  if (sampled <= 0) return { score: 0, low: 0, high: 0 };
  const score = Math.round((matches / sampled) * 100);
  const margin = Math.round((1 / Math.sqrt(sampled)) * 100);
  return {
    score,
    low: Math.max(0, score - margin),
    high: Math.min(100, score + margin),
  };
}
