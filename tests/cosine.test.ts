import { describe, expect, it } from "vitest";
import { cosineSimilarity, cosineTopK } from "../src/lib/cosine";

describe("cosineSimilarity", () => {
  it("is 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 10);
  });

  it("is 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 10);
  });

  it("is -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1, 10);
  });

  it("matches a hand-computed value", () => {
    // dot([1,2],[3,4]) = 11; |[1,2]| = sqrt(5); |[3,4]| = 5
    // cos = 11 / (5*sqrt(5)) = 11 / 11.1803... = 0.9838699...
    expect(cosineSimilarity([1, 2], [3, 4])).toBeCloseTo(11 / (5 * Math.sqrt(5)), 10);
  });
});

describe("cosineTopK", () => {
  it("returns the k closest vectors in descending order", () => {
    const vectors = [
      { id: "far", vector: [0, 1] },
      { id: "close", vector: [1, 0.01] },
      { id: "exact", vector: [1, 0] },
    ];
    const result = cosineTopK([1, 0], vectors, 2);
    expect(result.map((r) => r.id)).toEqual(["exact", "close"]);
  });
});
