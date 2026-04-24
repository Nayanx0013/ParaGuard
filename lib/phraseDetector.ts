/**
 * Local Phrase Replacement Map defined inline as requested.
 */
const LOCAL_REPLACEMENTS: Record<string, string[]> = {
  "furthermore": ["also", "on top of that", "besides"],
  "moreover": ["additionally", "as well", "besides"],
  "additionally": ["also", "plus", "and"],
  "utilize": ["use", "apply", "employ"],
  "delve": ["look into", "explore", "dig in"],
  "testament to": ["proof of", "sign of"],
  "pivotal": ["key", "huge", "main"],
  "seamlessly": ["smoothly", "easily", "perfectly"],
  "groundbreaking": ["new", "innovative", "fresh"],
  "cutting-edge": ["modern", "new", "latest"],
  "in conclusion": ["finally", "lastly", "to wrap up"],
  "in summary": ["basically", "overall", "shortly"],
  "tapestry": ["mix", "blend", "collection"],
  "multifaceted": ["complex", "varied", "rich"],
  "leverage": ["use", "tap into", "apply"],
  "robust": ["strong", "solid", "tough"],
  "enhance": ["improve", "boost", "better"],
  "innovative": ["new", "fresh", "creative"]
};

export type PhraseDetectionResult = {
  flaggedPhrases: Array<{ phrase: string; category: 'A'|'B'|'C'; position: number; suggestion: string[] }>;
  aiScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  sentenceStartPattern: { word: string; count: number }[];
};

/**
 * detectAIPhrases: Identifies common AI-linked phrases and patterns.
 */
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

  // Scan for all phrases in the local map
  Object.keys(LOCAL_REPLACEMENTS).forEach(phrase => {
    let index = lowerText.indexOf(phrase);
    while (index !== -1) {
      result.flaggedPhrases.push({
        phrase,
        category: phrase.length > 8 ? 'A' : 'B',
        position: index,
        suggestion: LOCAL_REPLACEMENTS[phrase]
      });
      score += phrase.length > 8 ? 10 : 5;
      index = lowerText.indexOf(phrase, index + 1);
    }
  });

  // Sentence Start Analysis
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const startWords = sentences.map(s => s.trim().split(/\s+/)[0]);
  
  const commonStarts = ["This", "The", "In", "It"];
  let currentWord = "";
  let consecutiveCount = 0;
  
  for (const word of startWords) {
    if (commonStarts.includes(word) && word === currentWord) {
      consecutiveCount++;
      if (consecutiveCount >= 3) {
         score += 10;
         const existing = result.sentenceStartPattern.find(p => p.word === word);
         if (existing) existing.count = consecutiveCount;
         else result.sentenceStartPattern.push({ word, count: consecutiveCount });
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
  return LOCAL_REPLACEMENTS[phrase.toLowerCase()] || ["rephrase this"];
}

export function calculateAIScore(text: string): number {
  return detectAIPhrases(text).aiScore;
}
