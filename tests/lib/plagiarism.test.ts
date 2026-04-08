import { describe, expect, it } from "vitest";
import {
  calculateWebPlagiarismScore,
  getSentences,
  selectSentencesForWebCheck,
} from "@/lib/plagiarism";

describe("plagiarism helpers", () => {
  it("extracts only meaningful sentences", () => {
    const input = "Tiny. This is a meaningful sentence with enough words. Another long sentence is included for sampling checks.";
    const sentences = getSentences(input);

    expect(sentences.length).toBe(2);
  });

  it("selects sentences using stratified positions", () => {
    const sentences = [
      "one two three four five six",
      "one two three four five six seven eight",
      "one two three four five six seven",
      "one two three four five six seven eight nine",
      "one two three four five six seven eight nine ten",
      "one two three four five six seven eight nine ten eleven",
    ];

    const selected = selectSentencesForWebCheck(sentences, 2);

    expect(selected).toEqual(["one two three four five six", "one two three four five six seven eight nine"]);
  });

  it("calculates percentage with a confidence band", () => {
    expect(calculateWebPlagiarismScore(2, 5)).toEqual({ score: 40, low: 0, high: 85 });
    expect(calculateWebPlagiarismScore(0, 0)).toEqual({ score: 0, low: 0, high: 0 });
  });
});
