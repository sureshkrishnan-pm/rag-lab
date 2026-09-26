import { describe, expect, it } from "vitest";
import { reciprocalRankFusion } from "../src/lib/rrf";

describe("reciprocalRankFusion", () => {
  it("matches a hand-computed score with k=60", () => {
    // "a" is rank 1 in list1 (1/61) and rank 2 in list2 (1/62)
    const scores = reciprocalRankFusion(
      [
        { ids: ["a", "b"] },
        { ids: ["b", "a"] },
      ],
      60,
    );
    expect(scores.get("a")).toBeCloseTo(1 / 61 + 1 / 62, 10);
    expect(scores.get("b")).toBeCloseTo(1 / 62 + 1 / 61, 10);
  });

  it("boosts a document that appears near the top of both lists", () => {
    const scores = reciprocalRankFusion([
      { ids: ["a", "b", "c"] },
      { ids: ["c", "a", "b"] },
    ]);
    expect(scores.get("a")!).toBeGreaterThan(scores.get("b")!);
  });

  it("applies per-list weights", () => {
    const scores = reciprocalRankFusion([
      { ids: ["a"], weight: 2 },
      { ids: ["b"], weight: 1 },
    ]);
    // both rank 1, so score = weight / (k + 1)
    expect(scores.get("a")!).toBeCloseTo(2 * scores.get("b")!, 10);
  });
});
