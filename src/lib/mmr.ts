import { cosineSimilarity } from "./cosine";

export interface MmrCandidate {
  id: string;
  vector: number[];
  relevance: number; // similarity to the query, already computed
}

/**
 * Maximal Marginal Relevance reranking: greedily picks the candidate that
 * maximizes lambda * relevance - (1 - lambda) * max similarity to anything
 * already selected, trading relevance for diversity.
 */
export function mmrRerank(candidates: MmrCandidate[], lambda: number, topN: number): string[] {
  const pool = [...candidates];
  const selected: MmrCandidate[] = [];

  while (selected.length < topN && pool.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < pool.length; i++) {
      const candidate = pool[i];
      const maxSim =
        selected.length === 0
          ? 0
          : Math.max(...selected.map((s) => cosineSimilarity(candidate.vector, s.vector)));
      const mmrScore = lambda * candidate.relevance - (1 - lambda) * maxSim;
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }

    selected.push(pool[bestIdx]);
    pool.splice(bestIdx, 1);
  }

  return selected.map((s) => s.id);
}
