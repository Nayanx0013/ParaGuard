import { describe, expect, it } from "vitest";
import { calculateSimilarityScore } from "@/lib/similarity";

describe("calculateSimilarityScore", () => {
  it("returns 100 for identical strings", () => {
    expect(calculateSimilarityScore("same text", "same text")).toBe(100);
  });

  it("returns 0 when either input is missing", () => {
    expect(calculateSimilarityScore("", "value")).toBe(0);
    expect(calculateSimilarityScore("value", "")).toBe(0);
  });
});
