export interface Chunk {
  id: string;
  docId: string;
  docTitle: string;
  text: string;
  start: number;
  end: number;
}

export type ChunkStrategy = "fixed" | "sentence";

export interface ChunkConfig {
  strategy: ChunkStrategy;
  size: number; // words, only used for "fixed"
  overlap: number; // words, only used for "fixed"
}

/** Splits text into sentences, keeping character offsets into the original text. */
export function splitSentences(text: string): Array<{ text: string; start: number; end: number }> {
  const sentences: Array<{ text: string; start: number; end: number }> = [];
  const re = /[^.!?]+[.!?]*/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const start = match.index + raw.indexOf(trimmed);
    sentences.push({ text: trimmed, start, end: start + trimmed.length });
  }
  return sentences;
}

/** Splits text into fixed-size, word-based windows with optional overlap. */
export function chunkFixedSize(
  text: string,
  size: number,
  overlap: number,
): Array<{ text: string; start: number; end: number }> {
  const words: Array<{ word: string; start: number; end: number }> = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    words.push({ word: m[0], start: m.index, end: m.index + m[0].length });
  }
  const step = Math.max(1, size - overlap);
  const chunks: Array<{ text: string; start: number; end: number }> = [];
  for (let i = 0; i < words.length; i += step) {
    const slice = words.slice(i, i + size);
    if (slice.length === 0) break;
    const start = slice[0].start;
    const end = slice[slice.length - 1].end;
    chunks.push({ text: text.slice(start, end), start, end });
    if (i + size >= words.length) break;
  }
  return chunks;
}

export function chunkDocument(
  docId: string,
  docTitle: string,
  text: string,
  config: ChunkConfig,
): Chunk[] {
  const raw =
    config.strategy === "sentence"
      ? splitSentences(text)
      : chunkFixedSize(text, config.size, config.overlap);

  return raw.map((c, i) => ({
    id: `${docId}::${i}`,
    docId,
    docTitle,
    text: c.text,
    start: c.start,
    end: c.end,
  }));
}
