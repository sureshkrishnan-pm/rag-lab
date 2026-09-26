import { describe, expect, it } from "vitest";
import { mmrRerank } from "../src/lib/mmr";

describe("mmrRerank", () => {
  it("with lambda=1 (pure relevance), ranks purely by relevance", () => {
    const candidates = [
      { id: "low", vector: [1, 0], relevance: 0.1 },
      { id: "high", vector: [1, 0], relevance: 0.9 },
      { id: "mid", vector: [1, 0], relevance: 0.5 },
    ];
    expect(mmrRerank(candidates, 1, 3)).toEqual(["high", "mid", "low"]);
  });

  it("with lambda=0 (pure diversity), avoids near-duplicates of what's already picked", () => {
    const candidates = [
      { id: "a", vector: [1, 0], relevance: 0.9 },
      { id: "a-duplicate", vector: [1, 0.001], relevance: 0.89 }, // near-identical to "a"
      { id: "different", vector: [0, 1], relevance: 0.5 },
    ];
    const result = mmrRerank(candidates, 0, 3);
    // first pick is whatever has highest relevance*lambda term (all tied at 0 for
    // relevance since lambda=0, so max-sim-to-empty-selection breaks the tie at 0
    // for everyone too - the implementation picks the first candidate deterministically)
    // What matters is that "different" is preferred over "a-duplicate" once "a" is selected.
    expect(result[0]).toBe("a");
    expect(result[1]).toBe("different");
  });
});
