export const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2";
export const EMBEDDING_DIM = 384;

// Loaded from a CDN at runtime rather than bundled: transformers.js ships
// its own WASM/ONNX runtime assets, and importing it as a URL avoids
// wiring that through Vite. The model itself is fetched once from the
// Hugging Face hub and cached by the browser's Cache API.
const TRANSFORMERS_CDN_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3/+esm";

export type ProgressCallback = (status: string, fraction: number) => void;

type FeatureExtractionPipeline = (
  texts: string[],
  options: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist: () => number[][] }>;

let pipelinePromise: Promise<FeatureExtractionPipeline> | null = null;

export function getEmbedder(onProgress?: ProgressCallback): Promise<FeatureExtractionPipeline> {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const mod = await import(/* @vite-ignore */ TRANSFORMERS_CDN_URL);
      const seen = new Map<string, number>();
      const pipe = await mod.pipeline("feature-extraction", EMBEDDING_MODEL, {
        progress_callback: (p: { status: string; file?: string; progress?: number }) => {
          if (!onProgress) return;
          if (p.status === "progress" && p.file && typeof p.progress === "number") {
            seen.set(p.file, p.progress);
            const values = [...seen.values()];
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            onProgress(`Downloading model (${p.file})`, avg / 100);
          } else if (p.status === "ready" || p.status === "done") {
            onProgress("Model ready", 1);
          }
        },
      });
      return pipe as unknown as FeatureExtractionPipeline;
    })();
  }
  return pipelinePromise;
}

export async function embedTexts(
  texts: string[],
  onProgress?: ProgressCallback,
): Promise<number[][]> {
  if (texts.length === 0) return [];
  const embedder = await getEmbedder(onProgress);
  const output = await embedder(texts, { pooling: "mean", normalize: true });
  return output.tolist();
}
