export interface SampleQuery {
  text: string;
  note: string;
}

export const SAMPLE_QUERIES: SampleQuery[] = [
  { text: "What is the Apollo program?", note: "direct keyword match" },
  { text: "How do satellites know their location?", note: "paraphrase — favors dense" },
  { text: "James Webb Space Telescope infrared mirror", note: "keyword-heavy — favors BM25" },
  { text: "Which rover carried a small helicopter to Mars?", note: "multi-hop detail" },
  { text: "What causes the aurora?", note: "paraphrase of space weather" },
  { text: "What's the best recipe for lasagna?", note: "unanswerable — out of domain" },
];
