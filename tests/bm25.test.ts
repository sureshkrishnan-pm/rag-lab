import { describe, expect, it } from "vitest";
import { buildBM25Index, bm25Score } from "../src/lib/bm25";

describe("bm25", () => {
  it("scores 0 for a doc with no query terms", () => {
    const index = buildBM25Index([
      { id: "a", text: "cats are great pets" },
      { id: "b", text: "dogs are loyal companions" },
    ]);
    const scores = bm25Score(index, "spacecraft");
    expect(scores.get("a")).toBe(0);
    expect(scores.get("b")).toBe(0);
  });

  it("ranks the doc with more query-term occurrences higher", () => {
    const index = buildBM25Index([
      { id: "few", text: "the rocket launched into orbit" },
      { id: "many", text: "rocket rocket rocket engines powered the rocket launch" },
      { id: "none", text: "the weather today is sunny and warm" },
    ]);
    const scores = bm25Score(index, "rocket");
    expect(scores.get("many")!).toBeGreaterThan(scores.get("few")!);
    expect(scores.get("few")!).toBeGreaterThan(scores.get("none")!);
    expect(scores.get("none")).toBe(0);
  });

  it("matches a hand-computed score for a minimal 2-doc corpus", () => {
    // doc "a": ["rocket"], doc "b": ["moon"]. avgDocLen = 1, N = 2.
    // idf("rocket") = ln(1 + (2-1+0.5)/(1+0.5)) = ln(2)
    const index = buildBM25Index([
      { id: "a", text: "rocket" },
      { id: "b", text: "moon" },
    ]);
    const scores = bm25Score(index, "rocket", 1.5, 0.75);
    const idf = Math.log(2);
    // f=1, k1=1.5, b=0.75, docLen=avgDocLen=1 -> denom = 1 + 1.5*(1-0.75+0.75*1) = 1 + 1.5 = 2.5
    const expected = idf * ((1 * 2.5) / 2.5);
    expect(scores.get("a")).toBeCloseTo(expected, 10);
    expect(scores.get("b")).toBe(0);
  });
});
