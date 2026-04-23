import { phraseReplacements } from "./phraseReplacements";

export type PhraseDetectionResult = {
  flaggedPhrases: Array<{ phrase: string, category: 'A'|'B'|'C', position: number, suggestion: string[] }>;
  aiScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  sentenceStartPattern: { word: string, count: number }[];
};

const CATEGORY_A = ["furthermore", "moreover", "additionally", "utilize", "utilization", "delve", "delves", "delving", "testament to", "pivotal", "seamlessly", "groundbreaking", "cutting-edge", "it is important to note", "it is worth noting", "in conclusion", "in summary", "in today's rapidly evolving", "in the realm of", "as previously mentioned", "it goes without saying", "needless to say", "last but not least"];
const CATEGORY_B = ["significant", "significantly", "comprehensive", "comprehensively", "robust", "enhance", "leverage", "innovative", "paradigm", "holistic", "streamline", "scalable", "actionable", "synergy", "ecosystem"];
const CATEGORY_C = ["This", "The", "In", "It"];

export function detectAIPhrases(text: string): PhraseDetectionResult {
  const result: PhraseDetectionResult = {
    flaggedPhrases: [],
    aiScore: 0,
    riskLevel: 'low',
    sentenceStartPattern: []
  };

  if (!text) return result;

  const lowerText = text.toLowerCase();
  let score = 0;

  // Check Category A
  for (const phrase of CATEGORY_A) {
    let index = lowerText.indexOf(phrase);
    while (index !== -1) {
      result.flaggedPhrases.push({
        phrase,
        category: 'A',
        position: index,
        suggestion: getSuggestedReplacements(phrase)
      });
      score += 10;
      index = lowerText.indexOf(phrase, index + 1);
    }
  }

  // Check Category B
  for (const phrase of CATEGORY_B) {
    let index = lowerText.indexOf(phrase);
    while (index !== -1) {
      result.flaggedPhrases.push({
        phrase,
        category: 'B',
        position: index,
        suggestion: getSuggestedReplacements(phrase)
      });
      score += 5;
      index = lowerText.indexOf(phrase, index + 1);
    }
  }

  // Check Category C (Sentence Starters)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const startWords = sentences.map(s => s.trim().split(/\s+/)[0]);
  
  let currentWord = "";
  let consecutiveCount = 0;
  
  for (const word of startWords) {
    if (CATEGORY_C.includes(word) && word === currentWord) {
      consecutiveCount++;
      if (consecutiveCount >= 4) {
         const existing = result.sentenceStartPattern.find(p => p.word === word);
         if (existing) {
             existing.count = consecutiveCount;
         } else {
             result.sentenceStartPattern.push({ word, count: consecutiveCount });
         }
         score += 15;
      }
    } else {
      currentWord = word;
      consecutiveCount = 1;
    }
  }

  result.aiScore = Math.min(100, score);
  if (result.aiScore >= 70) result.riskLevel = 'high';
  else if (result.aiScore >= 40) result.riskLevel = 'medium';

  return result;
}

export function getSuggestedReplacements(phrase: string): string[] {
  return phraseReplacements[phrase] || ["rephrase this"];
}

export function calculateAIScore(text: string): number {
  return detectAIPhrases(text).aiScore;
}
