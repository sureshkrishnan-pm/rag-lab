# Project Brief: RAG Lab — an in-browser RAG playground

## 1. Goal

Build **RAG Lab**, a static, interactive website that demonstrates a solid, practical understanding of Retrieval-Augmented Generation. It must:

- Run **entirely in the browser** (no backend, no server cost), so it can be hosted free on **GitHub Pages**.
- Let a visitor *see and tweak* every stage of a RAG pipeline: chunking, embedding, retrieval, reranking, prompt assembly, and evaluation.
- Show *measured* trade-offs (recall@k, MRR) between strategies, not just claims.
- Be readable as a portfolio piece: clean code, a strong README, a short write-up of design decisions.

The audience is a hiring manager or engineer who spends 2 minutes on the site and should walk away thinking "this person understands retrieval quality, not just how to call an LLM."

## 2. Core Concept

A small fixed corpus (~30-50 short documents) is pre-processed offline. In the browser, the user asks a question and watches the pipeline run step by step, with each stage inspectable. A side-by-side mode compares two retrieval configurations on the same query. An evaluation tab runs a golden question set and charts metrics per configuration.

### Corpus choice
Use a public, permissively licensed corpus that's small and has clear factual answers. Recommended: **a subset of Python standard library docs or a set of Wikipedia articles on one theme (e.g. space exploration)**. Store as plain text/markdown in `corpus/`. Include a `SOURCES.md` with licenses and attributions.

## 3. Features

### 3.1 Pipeline Explorer (main tab)
Stepper UI with these stages, each expandable to show internals:

1. **Query**: user types a question (with 5 suggested example queries as chips).
2. **Chunking**: show how documents were split. Configurable strategy: fixed-size (with overlap), sentence-based, and recursive/heading-aware. Chunk size and overlap sliders. Show chunk boundaries highlighted on a sample document.
3. **Embedding**: query embedded in-browser. Show the vector dimension, and a 2D projection (PCA or UMAP-lite) of chunk embeddings with the query point and top-k hits highlighted.
4. **Retrieval**: three modes selectable:
   - Dense (cosine similarity)
   - Sparse (BM25, implemented from scratch in JS)
   - Hybrid (Reciprocal Rank Fusion of dense + sparse, with weight control)
   Show ranked results with scores and which mode contributed each hit.
5. **Reranking (optional toggle)**: rerank top-N with a lightweight cross-encoder in the browser, or a simple MMR (Maximal Marginal Relevance) diversity rerank if the cross-encoder is too heavy. Show rank changes with up/down arrows.
6. **Prompt assembly**: show the exact final prompt (system + retrieved context with citations + question), with token estimate and a context-budget bar.
7. **Generation** (three modes, user-selectable):
   - **Extractive demo (default, no key needed)**: highlight the best-matching sentences from retrieved chunks as the "answer."
   - **Bring-your-own-key**: user pastes an API key, the browser calls an LLM API directly; key is kept in memory only, never stored or logged, with a clear notice.
   - **Prompt only**: just show the prompt, copyable.
8. **Citations**: answer references `[1]`, `[2]` map back to chunks, hover to highlight the source passage.

### 3.2 Compare Mode
Run the same query through two configurations side by side (e.g. Dense-only vs Hybrid+rerank). Highlight differences in retrieved sets and rank order.

### 3.3 Evaluation tab
- Ship a **golden set of ~30 questions**, each labeled with the chunk/doc IDs that contain the answer (`eval/golden.json`). Include a few deliberately hard cases: exact-keyword queries (favor BM25), paraphrased queries (favor dense), multi-hop, and unanswerable questions.
- Run all selected configurations in the browser and show a table + bar chart of: **Recall@k, Precision@k, MRR, nDCG@k**, plus average latency.
- Let the user vary chunk size / k / retrieval mode and re-run.
- A "failure gallery": list questions where each config failed, with a one-line diagnosis of *why* (vocabulary mismatch, chunk split answer across boundary, etc.).

### 3.4 "How it works" / Learnings page
Short, opinionated write-up (rendered from `docs/learnings.md`) covering: why chunking matters, dense vs sparse vs hybrid, when reranking pays off, evaluation pitfalls, what I'd do next (query rewriting, HyDE, late chunking, graph RAG). This is where understanding is shown in words.

## 4. Technical Architecture

**Principle: precompute heavy work offline, keep the browser light.**

### Offline build step (Python, run locally, output committed to repo)
`build/` directory with scripts:
- `chunk.py`: produces chunk files for each chunking config (e.g. sizes 200/400/800 tokens, overlap 0/50).
- `embed.py`: embeds all chunks with **`sentence-transformers/all-MiniLM-L6-v2`** (384-dim). Writes `public/data/chunks_<config>.json` and embeddings as a compact binary (`.bin`, float16 or quantized int8) with a manifest.
- `project.py`: computes a 2D projection (PCA or UMAP) of chunk embeddings and saves coordinates.
- `eval_precompute.py` (optional): precomputes baseline metrics for a fast first paint of the eval tab.
- `requirements.txt` and a `Makefile` (`make build`).

### Frontend (static site)
- **Vite + vanilla TypeScript** (or Preact) for a lightweight, framework-minimal bundle. No heavy UI framework required.
- **transformers.js** (`@xenova/transformers` / `@huggingface/transformers`) to embed the *query* in the browser with the **same model** as the offline step (critical: mismatched models = broken retrieval; note this in the README).
- Cache the model via the browser Cache API; show a loading progress bar on first visit.
- **BM25 implemented by hand in TS** (tokenizer, IDF, k1/b parameters exposed in UI). Unit tested.
- **Cosine similarity / top-k** in plain typed arrays; brute force is fine at this scale.
- **RRF** fusion implemented by hand. Unit tested.
- Charts: **Chart.js** or hand-rolled SVG. Embedding scatter: canvas or D3.
- Optional cross-encoder rerank via transformers.js (`Xenova/ms-marco-MiniLM-L-6-v2`); lazy-load only when toggled on.
- State in URL query params so a specific query + config is **shareable via link**.

### Repo layout
```
rag-lab/
├── README.md
├── SOURCES.md
├── Makefile
├── build/                # offline Python pipeline
│   ├── chunk.py
│   ├── embed.py
│   ├── project.py
│   └── requirements.txt
├── corpus/               # raw source documents
├── eval/
│   └── golden.json
├── docs/
│   └── learnings.md
├── src/
│   ├── main.ts
│   ├── pipeline/         # chunking view, retrieval, bm25, rrf, rerank, prompt
│   ├── eval/             # metrics + runner
│   ├── ui/               # components
│   └── lib/              # embed wrapper, math utils
├── public/data/          # generated chunks + embeddings (committed)
├── tests/                # vitest unit tests
├── .github/workflows/
│   └── deploy.yml        # build + deploy to GitHub Pages
├── index.html
├── vite.config.ts        # set `base` for the repo name
└── package.json
```

## 5. Quality Bar (this is what proves understanding)

- **Unit tests** for BM25, RRF, cosine top-k, and every metric (Recall@k, Precision@k, MRR, nDCG). Use known small examples with hand-computed answers.
- **Same embedding model** offline and in-browser, enforced by a shared `model.json` config and a test that checks embedding dimensions match.
- **No API key persistence**: in-memory only; state this in the UI and README.
- **Accessibility**: keyboard navigable, sensible contrast, responsive down to mobile width.
- **Performance**: first meaningful render under ~3s on broadband excluding model download; model download shows progress; total shipped data under ~25 MB.
- **Honest evaluation**: report where the system fails. Do not cherry-pick the golden set. Include unanswerable questions and show how the system behaves (e.g. low-similarity threshold → "no confident answer").
- Clean commit history with meaningful messages.

## 6. Deployment

- GitHub Actions workflow `deploy.yml`: on push to `main`, run tests, `npm run build`, deploy `dist/` to **GitHub Pages**.
- Set Vite `base` to `/<repo-name>/`.
- README includes a live demo link, a GIF/screenshot, and badges (CI status).

## 7. README Requirements

1. One-paragraph pitch + live demo link + screenshot/GIF.
2. "What this demonstrates" bullets (chunking, hybrid retrieval, reranking, evaluation, in-browser inference).
3. Architecture diagram (Mermaid) of offline vs in-browser stages.
4. Key findings table from the evaluation (e.g. "Hybrid improved Recall@5 from X to Y on keyword-heavy queries").
5. How to run locally and how to rebuild the data.
6. Design decisions and trade-offs; known limitations; future work.

## 8. Milestones (build in this order, commit after each)

1. **Scaffold**: repo, Vite + TS, GitHub Pages deploy of a hello-world page. Confirm deployment works first.
2. **Offline pipeline**: corpus → chunks → embeddings → JSON/bin in `public/data/`.
3. **Retrieval core** in TS: cosine top-k, BM25, RRF, all with tests.
4. **Browser query embedding** with transformers.js + Pipeline Explorer UI (query → retrieval results).
5. **Chunking view + embedding scatter plot.**
6. **Prompt assembly + extractive answer + citations.**
7. **Reranking** (MMR first, cross-encoder if time allows).
8. **Compare mode.**
9. **Golden set + Evaluation tab + metrics + failure gallery.**
10. **BYO-key generation mode.**
11. **Learnings page, README, polish, accessibility pass.**

## 9. Stretch Goals (only after all above is solid)

- Query rewriting / HyDE toggle (needs BYO key).
- Metadata filtering (e.g. filter by document source).
- Chunk-size sweep chart (recall vs chunk size).
- Side-by-side "with vs without retrieval" answer comparison to show hallucination reduction.

## 10. Instructions for Claude Code

- Work milestone by milestone; run tests and confirm the site builds after each.
- Ask before adding any dependency beyond those listed; prefer hand-written implementations for BM25, RRF, and metrics (that's the point of the project).
- Keep the UI simple, clean, and fast. Function over decoration.
- Never hardcode secrets. Never send user queries to any server other than the LLM API the user explicitly chooses in BYO-key mode.
- At the end, produce a checklist of what's done vs. remaining, and the exact commands to build data, run locally, and deploy.
