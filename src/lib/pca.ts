export interface PcaResult {
  mean: number[];
  pc1: number[];
  pc2: number[];
  points: Array<[number, number]>;
}

/** Mean-centers vectors, then finds the top-2 principal components via power
 * iteration on the covariance matrix (deflating after each component). Good
 * enough for a small demo corpus; not meant for large-scale use. */
export function computePCA(vectors: number[][]): PcaResult {
  const n = vectors.length;
  const dim = vectors[0]?.length ?? 0;
  if (n === 0 || dim === 0) return { mean: [], pc1: [], pc2: [], points: [] };

  const mean = new Array(dim).fill(0);
  for (const v of vectors) for (let j = 0; j < dim; j++) mean[j] += v[j] / n;
  const centered = vectors.map((v) => v.map((x, j) => x - mean[j]));

  const matVec = (matRows: number[][], vec: number[]): number[] => {
    // computes (X^T X) * vec without materializing the dim x dim matrix
    const xv = matRows.map((row) => row.reduce((s, x, j) => s + x * vec[j], 0));
    const result = new Array(dim).fill(0);
    matRows.forEach((row, i) => {
      for (let j = 0; j < dim; j++) result[j] += row[j] * xv[i];
    });
    return result;
  };

  const normalize = (v: number[]): number[] => {
    const mag = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
    return v.map((x) => x / mag);
  };

  const powerIteration = (matRows: number[][], iterations = 50): number[] => {
    let v = normalize(Array.from({ length: dim }, () => Math.random() - 0.5));
    for (let i = 0; i < iterations; i++) {
      v = normalize(matVec(matRows, v));
    }
    return v;
  };

  const pc1 = powerIteration(centered);
  const proj1 = centered.map((row) => row.reduce((s, x, j) => s + x * pc1[j], 0));
  // Deflate: remove the pc1 component from each row before finding pc2.
  const deflated = centered.map((row, i) => row.map((x, j) => x - proj1[i] * pc1[j]));
  const pc2 = powerIteration(deflated);
  const proj2 = centered.map((row) => row.reduce((s, x, j) => s + x * pc2[j], 0));

  const points: Array<[number, number]> = centered.map((_, i) => [proj1[i], proj2[i]]);
  return { mean, pc1, pc2, points };
}

/** Projects an arbitrary vector (e.g. a query embedding) into an existing PCA space. */
export function projectPoint(pca: PcaResult, vector: number[]): [number, number] {
  const centered = vector.map((x, j) => x - pca.mean[j]);
  const x = centered.reduce((s, v, j) => s + v * pca.pc1[j], 0);
  const y = centered.reduce((s, v, j) => s + v * pca.pc2[j], 0);
  return [x, y];
}
