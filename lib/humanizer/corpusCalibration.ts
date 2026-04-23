import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let corpusModel: any = null;

try {
  const filePath = path.join(process.cwd(), 'public', 'corpus-style-model.json');
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    corpusModel = JSON.parse(data);
  }
} catch (_e) {
  // Ignore
}

export function calibrateBurstinessScore(rawScore: number): number {
  if (!corpusModel) return rawScore;
  return rawScore * 1.05; 
}

export function getCorpusHumanPatterns(): string[] {
  if (!corpusModel) return [];
  return corpusModel.humanTransitionPhrases || [];
}

export function getCorpusAwarePromptInjection(_level: 1|2|3): string {
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