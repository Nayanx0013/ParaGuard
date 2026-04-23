let corpusModel: any = null;

try {
  corpusModel = require('../../public/corpus-style-model.json');
} catch (e) {
  // console.warn('Corpus model not found. Build it with buildCorpusModel.ts');
}

export function calibrateBurstinessScore(rawScore: number): number {
  if (!corpusModel) return rawScore;
  // Stub for actual calibration math based on loaded JSON
  return rawScore * 1.05; 
}

export function getCorpusHumanPatterns(): string[] {
  if (!corpusModel) return [];
  return corpusModel.humanTransitionPhrases || [];
}

export function getCorpusAwarePromptInjection(level: 1|2|3): string {
  if (!corpusModel) return "";
  const phrases = getCorpusHumanPatterns().slice(0, 10).join(", ");
  return `Use these transition phrases that appear frequently in human writing: ${phrases}`;
}

export function getCorpusStatus() {
  if (!corpusModel) return { isLoaded: false };
  return {
      isLoaded: true,
      documentsAnalyzed: corpusModel.documentsAnalyzed,
      thresholds: corpusModel.calibratedThresholds
  };
}