# RAG Lab

An in-browser Retrieval-Augmented Generation playground. Type a question and
watch it get **chunked, embedded (a real model, running live in your
browser), retrieved with dense/sparse/hybrid search, reranked, assembled
into a prompt, and answered with citations** — all client-side, no backend,
no API keys.

**Live demo:** https://sureshkrishnan-pm.github.io/rag-lab/

## What this demonstrates

- Chunking strategies (sentence-based / fixed-size with overlap) and their effect on retrieval
- Real in-browser embedding inference via [transformers.js](https://huggingface.co/docs/transformers.js), using the same `Xenova/all-MiniLM-L6-v2` model for the corpus and the query
- Hand-written, unit-tested BM25, cosine top-k, Reciprocal Rank Fusion, and MMR reranking — no retrieval library
- Prompt assembly with citations and a token-budget estimate
- Honest failure handling: an out-of-domain question (try the "lasagna" chip) correctly returns "no confident answer" instead of hallucinating one

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
```

Unit tests cover BM25, cosine similarity/top-k, RRF, MMR, and chunking, with
hand-computed expected values for the core math.

## Deployment

Pushes to `main` run tests, build the site, and deploy `dist/` to GitHub Pages
via [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## Design decisions and simplifications

- **No offline Python pipeline (yet).** The corpus is small (10 short docs,
  ~46 chunks), so it's embedded live in the browser on page load instead of
  being precomputed offline — this keeps the demo genuinely interactive for
  any typed query, not just a fixed sample set, without needing a Python
  environment. A precomputed offline pipeline (per the original project
  brief) is still worth adding later for a larger corpus.
- **transformers.js is loaded from a CDN at runtime** (`import()` of a
  `+esm` URL) rather than bundled via npm, to avoid wiring its WASM/ONNX
  runtime assets through Vite. The model itself is cached by the browser's
  Cache API after first load.
- **Extractive answers only.** Generation is a hand-rolled "highlight the
  best-matching sentence" heuristic, so the whole demo works with zero API
  keys. A bring-your-own-key LLM mode is a natural next step.

See [RAG_LAB_PROJECT.md](RAG_LAB_PROJECT.md) for the full original brief,
including stretch goals (compare mode, evaluation tab with golden-set
metrics, BYO-key generation) not yet built.
