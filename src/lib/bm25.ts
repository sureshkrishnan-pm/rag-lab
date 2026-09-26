import { tokenize } from "./tokenize";

export interface BM25Doc {
  id: string;
  text: string;
}

export interface BM25Index {
  ids: string[];
  docTokens: string[][];
  docLen: number[];
  avgDocLen: number;
  idf: Map<string, number>;
  N: number;
}

export function buildBM25Index(docs: BM25Doc[]): BM25Index {
  const ids = docs.map((d) => d.id);
  const docTokens = docs.map((d) => tokenize(d.text));
  const docLen = docTokens.map((t) => t.length);
  const N = docs.length;
  const avgDocLen = N === 0 ? 0 : docLen.reduce((a, b) => a + b, 0) / N;

  const df = new Map<string, number>();
  for (const tokens of docTokens) {
    for (const term of new Set(tokens)) {
      df.set(term, (df.get(term) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, freq] of df) {
    idf.set(term, Math.log(1 + (N - freq + 0.5) / (freq + 0.5)));
  }

  return { ids, docTokens, docLen, avgDocLen, idf, N };
}

/** Okapi BM25 scores for every document in the index against a query string. */
export function bm25Score(
  index: BM25Index,
  query: string,
  k1 = 1.5,
  b = 0.75,
): Map<string, number> {
  const qTokens = tokenize(query);
  const scores = new Map<string, number>();

  index.ids.forEach((id, i) => {
    const tokens = index.docTokens[i];
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);

    let score = 0;
    for (const term of qTokens) {
      const f = tf.get(term) ?? 0;
      if (f === 0) continue;
      const idfVal = index.idf.get(term) ?? 0;
      const denom = f + k1 * (1 - b + b * (index.docLen[i] / (index.avgDocLen || 1)));
      score += idfVal * ((f * (k1 + 1)) / denom);
    }
    scores.set(id, score);
  });

  return scores;
}
