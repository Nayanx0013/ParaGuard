export type BurstinessResult = {
  burstinessScore: number;
  meanSentenceLength: number;
  sentenceLengthStdDev: number;
  vocabularyDiversity: number;
  passiveVoiceRatio: number;
  consecutiveSameLengthCount: number;
  paragraphVariance: number;
  humanLikelihoodScore: number;
  verdict: 'likely-human' | 'borderline' | 'likely-ai';
  weaknesses: string[];
};

export function scoreBurstiness(text: string): BurstinessResult {
  const result: BurstinessResult = {
    burstinessScore: 0,
    meanSentenceLength: 0,
    sentenceLengthStdDev: 0,
    vocabularyDiversity: 0,
    passiveVoiceRatio: 0,
    consecutiveSameLengthCount: 0,
    paragraphVariance: 0,
    humanLikelihoodScore: 0,
    verdict: 'likely-ai',
    weaknesses: []
  };

  if (!text.trim()) return result;

  // Split into sentences and filter empty
  const sentences = text.match(/[^.!?]+[.!?]+/g)?.map(s => s.trim()).filter(s => s.length > 0) || [];
  if (sentences.length === 0) return result;

  // Sentence Lengths
  const lengths = sentences.map(s => s.split(/\s+/).length);
  const totalWords = lengths.reduce((a, b) => a + b, 0);
  result.meanSentenceLength = totalWords / sentences.length;

  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - Math.max(result.meanSentenceLength, 0.001), 2), 0) / sentences.length;
  result.sentenceLengthStdDev = Math.sqrt(variance);

  // Burstiness
  result.burstinessScore = result.meanSentenceLength > 0 ? (result.sentenceLengthStdDev / result.meanSentenceLength) : 0;

  // Vocabulary Diversity (Type-Token Ratio)
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const uniqueWords = new Set(words);
  result.vocabularyDiversity = words.length > 0 ? uniqueWords.size / words.length : 0;

  // Passive Voice
  const passiveVoiceRegex = /\b(?:was|were|is|are|been)\s+[a-z]+ed\b/gi;
  const passiveMatches = text.match(passiveVoiceRegex) || [];
  result.passiveVoiceRatio = sentences.length > 0 ? passiveMatches.length / sentences.length : 0;

  // Consecutive same length
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  for (let i = 1; i < lengths.length; i++) {
     if (Math.abs(lengths[i] - lengths[i-1]) <= 3) {
         currentConsecutive++;
     } else {
         currentConsecutive = 0;
     }
     maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
  }
  result.consecutiveSameLengthCount = maxConsecutive;

  // Paragraph Variance
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const pLengths = paragraphs.map(p => p.split(/\s+/).length);
  const pMean = pLengths.reduce((a, b) => a + b, 0) / (pLengths.length || 1);
  const pVariance = pLengths.reduce((sum, len) => sum + Math.pow(len - pMean, 2), 0) / (pLengths.length || 1);
  result.paragraphVariance = Math.sqrt(pVariance);

  // Human Likelihood Score Calculation
  let rawScore = 0;
  
  // Burstiness (target: 0.426) -> 40 pts max
  const burstDiff = Math.abs(result.burstinessScore - 0.426);
  const burstPts = Math.max(0, 40 - (burstDiff * 100)); // somewhat arbitrary scaling
  rawScore += burstPts;

  // Vocab (target: 0.694) -> 30 pts max
  const vocabDiff = Math.abs(result.vocabularyDiversity - 0.694);
  const vocabPts = Math.max(0, 30 - (vocabDiff * 100));
  rawScore += vocabPts;

  // Passive Voice (target: 0.181) -> 20 pts max
  const passiveDiff = Math.abs(result.passiveVoiceRatio - 0.181);
  const passivePts = Math.max(0, 20 - (passiveDiff * 100));
  rawScore += passivePts;

  // Paragraph Variance -> 10 pts (just reward higher variance)
  const pVarPts = Math.min(10, result.paragraphVariance / 2);
  rawScore += pVarPts;

  result.humanLikelihoodScore = Math.min(100, Math.max(0, rawScore));

  // Determine Verdict
  if (result.humanLikelihoodScore >= 70) result.verdict = 'likely-human';
  else if (result.humanLikelihoodScore >= 40) result.verdict = 'borderline';
  else result.verdict = 'likely-ai';

  // Weaknesses
  if (result.consecutiveSameLengthCount >= 3) result.weaknesses.push("Multiple consecutive sentences have very similar lengths.");
  if (result.vocabularyDiversity < 0.5) result.weaknesses.push("Low vocabulary diversity. Many repeated words.");
  if (!text.match(/'(?:s|re|ve|m|ll|d|t)\b/)) result.weaknesses.push("Zero contractions detected. Try using them.");
  if (!text.includes("?")) result.weaknesses.push("No question marks. Consider adding a rhetorical question.");
  const aiSentences = lengths.filter(l => l >= 15 && l <= 22).length;
  if (sentences.length > 0 && aiSentences / sentences.length > 0.6) {
      result.weaknesses.push("More than 60% of sentences are 15-22 words long (AI pattern).");
  }

  return result;
}

export function getImprovementTips(result: BurstinessResult): string[] {
  const tips: string[] = [];
  if (result.weaknesses.some(w => w.includes("consecutive sentences"))) tips.push("Vary sentence lengths: mix short (3-8 words) and long (25+ words) sentences.");
  if (result.weaknesses.some(w => w.includes("contractions"))) tips.push("Add an informal contraction (e.g., 'it's', 'they're').");
  if (result.weaknesses.some(w => w.includes("question"))) tips.push("Pose a question to break up declarative statements.");
  if (result.weaknesses.some(w => w.includes("15-22 words"))) tips.push("Break up mid-length sentences, or combine them to make longer ones.");
  return tips.length > 0 ? tips : ["Your text structure looks nicely varied!"];
}
