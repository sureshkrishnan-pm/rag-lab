import type { Chunk } from "./chunk";

export const SYSTEM_PROMPT =
  "You are a helpful assistant. Answer the question using only the numbered context passages below. Cite the passage numbers you used, like [1]. If the passages don't contain the answer, say you don't have enough information.";

export interface PromptResult {
  prompt: string;
  estimatedTokens: number;
}

/** Rough token estimate (~4 chars/token for English) — good enough for a budget bar, not billing. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function assemblePrompt(question: string, contextChunks: Chunk[]): PromptResult {
  const context = contextChunks
    .map((c, i) => `[${i + 1}] (${c.docTitle}) ${c.text}`)
    .join("\n\n");

  const prompt = `${SYSTEM_PROMPT}\n\nContext:\n${context}\n\nQuestion: ${question}\n\nAnswer:`;

  return { prompt, estimatedTokens: estimateTokens(prompt) };
}
