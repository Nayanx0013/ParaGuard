import fs from 'fs';
import path from 'path';

/**
 * corpusCalibration: Syncs AI scores with real human writing patterns.
 */

interface CorpusModel {
  varianceFactor: number;
  humanTransitions: string[];
  version: string;
  updatedAt: string;
}

let corpusModel: CorpusModel | null = null;

try {
  const filePath = path.join(process.cwd(), 'public', 'corpus-style-model.json');
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    corpusModel = JSON.parse(data) as CorpusModel;
  }
} catch {
  // Graceful fallback if loading fails
}

/**
 * Adjusts the burstiness score based on known human document variance.
 */
export function calibrateBurstinessScore(rawScore: number): number {
  if (!corpusModel) return rawScore;
  const factor = corpusModel.varianceFactor || 1.1;
  return Math.min(100, rawScore * factor);
}

/**
 * Returns human-like transition phrases identified in the corpus.
 */
export function getCorpusHumanPatterns(): string[] {
  if (!corpusModel) return [];
  return corpusModel.humanTransitions || [];
}

/**
 * Generates a prompt injection based on successful human patterns.
 */
export function getCorpusAwarePromptInjection(): string {
  if (!corpusModel) return "";
  const phrases = getCorpusHumanPatterns().slice(0, 5).join(", ");
  return phrases ? `\nMake sure to occasionally use natural transitions like: ${phrases}.` : "";
}

/**
 * Returns the status of the corpus engine.
 */
export function getCorpusStatus() {
  return {
    isLoaded: !!corpusModel,
    version: corpusModel?.version || "default",
    lastUpdated: corpusModel?.updatedAt || "N/A"
  };
}