export function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

export function norm(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const denom = norm(a) * norm(b);
  return denom === 0 ? 0 : dot(a, b) / denom;
}

export interface ScoredId {
  id: string;
  score: number;
}

/** Brute-force top-k by cosine similarity. Fine at the scale of this demo. */
export function cosineTopK(
  query: number[],
  vectors: Array<{ id: string; vector: number[] }>,
  k: number,
): ScoredId[] {
  const scored = vectors.map((v) => ({ id: v.id, score: cosineSimilarity(query, v.vector) }));
  scored.sort((x, y) => y.score - x.score);
  return scored.slice(0, k);
}
