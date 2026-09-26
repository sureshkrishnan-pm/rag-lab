# RAG Lab

An in-browser Retrieval-Augmented Generation playground — chunking, embedding,
dense/sparse/hybrid retrieval, reranking, prompt assembly, and evaluation, all
running client-side with no backend. Hosted free on GitHub Pages.

**Status:** scaffold stage. See [RAG_LAB_PROJECT.md](RAG_LAB_PROJECT.md) for the
full project brief and milestone plan.

## What this demonstrates (planned)

- Chunking strategies and their effect on retrieval quality
- Dense (cosine), sparse (hand-written BM25), and hybrid (RRF) retrieval
- Reranking (MMR / cross-encoder)
- Retrieval evaluation: Recall@k, Precision@k, MRR, nDCG@k
- In-browser embedding inference via transformers.js

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

## Deployment

Pushes to `main` run tests, build the site, and deploy `dist/` to GitHub Pages
via [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

## Design decisions and roadmap

See [RAG_LAB_PROJECT.md](RAG_LAB_PROJECT.md) for architecture, milestones, and
stretch goals. A `docs/learnings.md` write-up will follow once the pipeline is
in place.
