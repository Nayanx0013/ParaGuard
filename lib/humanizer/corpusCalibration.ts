import fs from 'fs';
import path from 'path';

/**
 * corpusCalibration: Syncs AI scores with real human writing patterns.
 * Powered by public/corpus-style-model.json — a curated set of statistical
 * signatures extracted from verified human-written text.
 */

interface CorpusModel {
  version: string;
  updatedAt: string;
  description: string;
  varianceFactor: number;
  targetBurstiness: number;
  targetVocabDiversity: number;
  targetPassiveRatio: number;
  avgSentenceLength: number;
  avgSentenceLengthStdDev: number;
  humanTransitions: string[];
  humanSentenceStarters: string[];
  avoidPatterns: string[];
  styleSignatures: {
    contractionRate: number;
    questionRate: number;
    firstPersonRate: number;
    shortSentenceRate: number;
    longSentenceRate: number;
  };
}

let corpusModel: CorpusModel | null = null;

try {
  const filePath = path.join(process.cwd(), 'public', 'corpus-style-model.json');
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    corpusModel = JSON.parse(data) as CorpusModel;
  }
} catch {
  // Graceful fallback — all functions return safe defaults
}

/**
 * Adjusts the burstiness score based on known human document variance.
 */
export function calibrateBurstinessScore(rawScore: number): number {
  if (!corpusModel) return rawScore;
  const factor = corpusModel.varianceFactor || 1.0;
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
 * Returns patterns the humanizer should actively avoid in output.
 */
export function getCorpusAvoidPatterns(): string[] {
  if (!corpusModel) return [];
  return corpusModel.avoidPatterns || [];
}

/**
 * Returns natural sentence starter words from the corpus.
 */
export function getCorpusSentenceStarters(): string[] {
  if (!corpusModel) return [];
  return corpusModel.humanSentenceStarters || [];
}

/**
 * Generates a rich prompt injection based on the corpus human writing patterns.
 * Includes both what to USE and what to AVOID.
 */
export function getCorpusAwarePromptInjection(): string {
  if (!corpusModel) return '';

  const transitions = getCorpusHumanPatterns().slice(0, 6).join('", "');
  const avoid = getCorpusAvoidPatterns().slice(0, 8).join('", "');
  const starters = getCorpusSentenceStarters().slice(0, 4).join('", "');

  const parts: string[] = [];

  if (transitions) {
    parts.push(`\nNaturally weave in transitions like: "${transitions}".`);
  }
  if (starters) {
    parts.push(`Start some sentences with: "${starters}".`);
  }
  if (avoid) {
    parts.push(`Strictly avoid these AI-flagged patterns: "${avoid}".`);
  }

  return parts.length > 0 ? '\n\n' + parts.join(' ') : '';
}

/**
 * Returns the human writing style signatures for calibration reference.
 */
export function getCorpusStyleSignatures() {
  return corpusModel?.styleSignatures || null;
}

/**
 * Returns the status of the corpus engine.
 */
export function getCorpusStatus() {
  return {
    isLoaded: !!corpusModel,
    version: corpusModel?.version || 'default',
    lastUpdated: corpusModel?.updatedAt || 'N/A',
    transitionCount: corpusModel?.humanTransitions.length || 0,
    avoidPatternCount: corpusModel?.avoidPatterns.length || 0,
  };
}