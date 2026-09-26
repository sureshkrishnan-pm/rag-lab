import { describe, expect, it } from "vitest";
import { chunkDocument, splitSentences, chunkFixedSize } from "../src/lib/chunk";

describe("splitSentences", () => {
  it("splits on sentence terminators and preserves offsets", () => {
    const text = "First sentence. Second sentence! Third?";
    const sentences = splitSentences(text);
    expect(sentences.map((s) => s.text)).toEqual([
      "First sentence.",
      "Second sentence!",
      "Third?",
    ]);
    for (const s of sentences) {
      expect(text.slice(s.start, s.end)).toBe(s.text);
    }
  });
});

describe("chunkFixedSize", () => {
  it("splits into windows of the given word size with no overlap", () => {
    const text = "one two three four five six";
    const chunks = chunkFixedSize(text, 2, 0);
    expect(chunks.map((c) => c.text)).toEqual(["one two", "three four", "five six"]);
  });

  it("overlaps windows by the given number of words", () => {
    const text = "one two three four five";
    const chunks = chunkFixedSize(text, 3, 1);
    // step = size - overlap = 2
    expect(chunks.map((c) => c.text)).toEqual(["one two three", "three four five"]);
  });
});

describe("chunkDocument", () => {
  it("assigns stable ids and preserves doc metadata", () => {
    const chunks = chunkDocument("doc1", "Doc One", "Hello world. Bye now.", {
      strategy: "sentence",
      size: 0,
      overlap: 0,
    });
    expect(chunks).toHaveLength(2);
    expect(chunks[0].id).toBe("doc1::0");
    expect(chunks[0].docId).toBe("doc1");
    expect(chunks[0].docTitle).toBe("Doc One");
  });
});
