import { splitSentences } from "./chunk";
import { tokenize } from "./tokenize";
import type { Chunk } from "./chunk";

export interface ExtractiveAnswer {
  sentence: string;
  sourceChunkIndex: number; // index into the passed-in contextChunks, for citation
  overlapScore: number;
}

/**
 * Extractive "generation": picks the sentence, across all retrieved chunks,
 * with the most query-term overlap. No LLM involved — this is a stand-in
 * for BYO-key generation mode.
 */
export function extractiveAnswer(
  question: string,
  contextChunks: Chunk[],
  minOverlap = 1,
): ExtractiveAnswer | null {
  const qTokens = new Set(tokenize(question));
  let bestScore = -1;
  let bestAnswer: ExtractiveAnswer | null = null;

  for (let chunkIndex = 0; chunkIndex < contextChunks.length; chunkIndex++) {
    for (const s of splitSentences(contextChunks[chunkIndex].text)) {
      const sTokens = tokenize(s.text);
      const overlap = sTokens.filter((t) => qTokens.has(t)).length;
      if (overlap > 0 && overlap > bestScore) {
        bestScore = overlap;
        bestAnswer = { sentence: s.text, sourceChunkIndex: chunkIndex, overlapScore: overlap };
      }
    }
  }

  if (bestAnswer && bestScore >= minOverlap) return bestAnswer;
  return null;
}
