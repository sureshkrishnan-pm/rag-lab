export interface RankedList {
  ids: string[]; // in rank order, best first
  weight?: number;
}

/**
 * Reciprocal Rank Fusion: score(d) = sum over lists containing d of
 * weight_i / (k + rank_i), where rank is 1-based. Higher score is better.
 */
export function reciprocalRankFusion(lists: RankedList[], k = 60): Map<string, number> {
  const scores = new Map<string, number>();
  for (const list of lists) {
    const weight = list.weight ?? 1;
    list.ids.forEach((id, i) => {
      const rank = i + 1;
      const contribution = weight / (k + rank);
      scores.set(id, (scores.get(id) ?? 0) + contribution);
    });
  }
  return scores;
}
