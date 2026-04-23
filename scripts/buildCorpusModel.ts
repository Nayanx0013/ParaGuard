import fs from 'fs';
import path from 'path';

// Mock script for building corpus
console.log("Analyzing corpus...");
console.log("Saving model to public/corpus-style-model.json...");

const dummyData = {
  version: "1.0",
  documentsAnalyzed: 500,
  calibratedThresholds: {
    burstiness: { human_min: 0.3, human_target: 0.426, ai_typical: 0.12 },
    vocabularyDiversity: { human_min: 0.55, human_target: 0.694, ai_typical: 0.45 },
    meanSentenceLength: { human_range: [18, 24], ai_typical: 18.2 },
    passiveVoiceRatio: { human_range: [0.12, 0.25], ai_typical: 0.08 }
  },
  humanTransitionPhrases: ["it turns out", "Interestingly enough", "On the other hand", "That being said", "By contrast"],
  humanSentenceStarters: ["However", "Yet", "Because of this", "Ultimately"],
  topHumanPatterns: []
};

try {
    fs.mkdirSync(path.join(__dirname, '../public'), { recursive: true });
    fs.writeFileSync(path.join(__dirname, '../public/corpus-style-model.json'), JSON.stringify(dummyData, null, 2));
    console.log("Model saved.");
} catch(e) {
    console.error("Failed to save corpus model", e);
}