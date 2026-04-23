import stringSimilarity from 'string-similarity';

export function calculateSimilarityScore(original: string, rewritten: string): number {
  if (!original || !rewritten) return 0;
  
  // The compareTwoStrings function returns a fraction between 0 and 1.
  // 1 indicates a perfect match, 0 indicates no match.
  const score = stringSimilarity.compareTwoStrings(original, rewritten);
  
  // Return as a percentage (e.g., 0.85 -> 85)
  return Math.round(score * 100);
}
