import "./style.css";
import { CORPUS } from "./data/corpus";
import { SAMPLE_QUERIES } from "./data/queries";
import { chunkDocument, type Chunk, type ChunkConfig } from "./lib/chunk";
import { buildBM25Index, bm25Score, type BM25Index } from "./lib/bm25";
import { cosineTopK, type ScoredId } from "./lib/cosine";
import { reciprocalRankFusion } from "./lib/rrf";
import { mmrRerank } from "./lib/mmr";
import { computePCA, projectPoint, type PcaResult } from "./lib/pca";
import { assemblePrompt } from "./lib/prompt";
import { extractiveAnswer } from "./lib/extract";
import { embedTexts, EMBEDDING_MODEL, EMBEDDING_DIM } from "./lib/embed";
import { renderScatter, type ScatterPoint } from "./ui/scatter";

const TOKEN_BUDGET = 2048;
const TOP_K = 5;
const RERANK_POOL = 10;
const RANK_POOL_FOR_FUSION = 20;

type RetrievalMode = "dense" | "sparse" | "hybrid";

interface AppState {
  chunkConfig: ChunkConfig;
  chunks: Chunk[];
  chunksById: Map<string, Chunk>;
  chunkVectors: Array<{ id: string; vector: number[] }>;
  bm25Index: BM25Index | null;
  pca: PcaResult | null;
  mode: RetrievalMode;
  denseWeight: number;
  rerankEnabled: boolean;
  mmrLambda: number;
  embedderReady: boolean;
  lastQuery: string | null;
  lastQueryVector: number[] | null;
}

const state: AppState = {
  chunkConfig: { strategy: "sentence", size: 40, overlap: 8 },
  chunks: [],
  chunksById: new Map(),
  chunkVectors: [],
  bm25Index: null,
  pca: null,
  mode: "dense",
  denseWeight: 0.5,
  rerankEnabled: false,
  mmrLambda: 0.5,
  embedderReady: false,
  lastQuery: null,
  lastQueryVector: null,
};

const docIds = CORPUS.map((d) => d.id);
const SAMPLE_DOC_ID = "apollo";

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// ---------- shell ----------

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <header>
    <h1>RAG Lab</h1>
    <p class="tagline">An in-browser Retrieval-Augmented Generation playground — every stage runs live in your browser, including real embedding inference. No backend, no data leaves your machine.</p>
  </header>
  <main>
    <section id="query-section">
      <label for="query-input"><strong>Ask a question</strong></label>
      <div class="query-row">
        <input id="query-input" type="text" placeholder="e.g. What is the Apollo program?" />
        <button id="run-btn" disabled>Run</button>
      </div>
      <div id="chips"></div>
    </section>

    <section class="panel">
      <h2>1. Chunking</h2>
      <p class="hint">Documents are split into retrievable chunks. Sentence-based chunking keeps semantic units intact; fixed-size chunking gives uniform windows with configurable overlap.</p>
      <div class="controls">
        <label>Strategy
          <select id="chunk-strategy">
            <option value="sentence">Sentence-based</option>
            <option value="fixed">Fixed-size</option>
          </select>
        </label>
        <label id="size-control" style="display:none">Size <input id="chunk-size" type="range" min="10" max="80" value="40" /> <span id="chunk-size-val">40</span>w</label>
        <label id="overlap-control" style="display:none">Overlap <input id="chunk-overlap" type="range" min="0" max="30" value="8" /> <span id="chunk-overlap-val">8</span>w</label>
        <button id="apply-chunking" class="secondary">Apply &amp; re-embed</button>
      </div>
      <div id="chunk-preview"></div>
    </section>

    <section class="panel">
      <h2>2. Embedding</h2>
      <p class="hint">Model: <code>${EMBEDDING_MODEL}</code> · ${EMBEDDING_DIM} dimensions · downloaded once from a CDN and cached by your browser.</p>
      <div id="embedding-status">Loading model…<div class="progress-bar"><div id="progress-fill" style="width:0%"></div></div></div>
      <div id="scatter-container"></div>
    </section>

    <section class="panel">
      <h2>3. Retrieval</h2>
      <div class="controls">
        <label><input type="radio" name="mode" value="dense" checked /> Dense (cosine)</label>
        <label><input type="radio" name="mode" value="sparse" /> Sparse (BM25)</label>
        <label><input type="radio" name="mode" value="hybrid" /> Hybrid (RRF)</label>
        <label id="hybrid-weight-label" style="display:none">Dense weight <input id="hybrid-weight" type="range" min="0" max="1" step="0.1" value="0.5" /> <span id="hybrid-weight-val">0.5</span></label>
      </div>
      <div id="retrieval-results"><p class="hint">Run a query to see retrieval results.</p></div>
    </section>

    <section class="panel">
      <h2>4. Reranking (MMR)</h2>
      <p class="hint">Maximal Marginal Relevance trades some relevance for diversity, penalizing results that are too similar to ones already picked.</p>
      <div class="controls">
        <label><input id="rerank-toggle" type="checkbox" /> Enable</label>
        <label>Lambda (relevance ↔ diversity) <input id="mmr-lambda" type="range" min="0" max="1" step="0.1" value="0.5" /> <span id="mmr-lambda-val">0.5</span></label>
      </div>
      <div id="rerank-results"></div>
    </section>

    <section class="panel">
      <h2>5. Prompt assembly</h2>
      <div id="token-bar-container"><div id="token-bar"></div></div>
      <p class="hint" id="token-hint"></p>
      <pre id="prompt-box">Run a query to see the assembled prompt.</pre>
      <button id="copy-prompt" class="secondary">Copy prompt</button>
    </section>

    <section class="panel">
      <h2>6. Answer (extractive)</h2>
      <p class="hint">No LLM call is made here — the best-matching sentence from the retrieved context is highlighted as a stand-in for generation, so this works with zero API keys.</p>
      <div id="answer-box"><p class="hint">Run a query to see an answer.</p></div>
    </section>
  </main>
  <footer>
    <a href="https://github.com/sureshkrishnan-pm/rag-lab" target="_blank" rel="noopener">Source on GitHub</a>
  </footer>
`;

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

// ---------- example query chips ----------

el("chips").innerHTML = SAMPLE_QUERIES.map(
  (q) => `<button class="chip" data-query="${escapeHtml(q.text)}" type="button">${escapeHtml(q.text)} <em>(${escapeHtml(q.note)})</em></button>`,
).join("");

el("chips").addEventListener("click", (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>(".chip");
  if (!target) return;
  const input = el<HTMLInputElement>("query-input");
  input.value = target.dataset.query ?? "";
  runQuery();
});

// ---------- chunking controls ----------

function updateChunkControlVisibility() {
  const isFixed = state.chunkConfig.strategy === "fixed";
  el("size-control").style.display = isFixed ? "" : "none";
  el("overlap-control").style.display = isFixed ? "" : "none";
}

el<HTMLSelectElement>("chunk-strategy").addEventListener("change", (e) => {
  state.chunkConfig.strategy = (e.target as HTMLSelectElement).value as ChunkConfig["strategy"];
  updateChunkControlVisibility();
  renderChunkPreview();
});

el<HTMLInputElement>("chunk-size").addEventListener("input", (e) => {
  state.chunkConfig.size = Number((e.target as HTMLInputElement).value);
  el("chunk-size-val").textContent = String(state.chunkConfig.size);
  renderChunkPreview();
});

el<HTMLInputElement>("chunk-overlap").addEventListener("input", (e) => {
  state.chunkConfig.overlap = Number((e.target as HTMLInputElement).value);
  el("chunk-overlap-val").textContent = String(state.chunkConfig.overlap);
  renderChunkPreview();
});

el("apply-chunking").addEventListener("click", () => {
  void reindexAndEmbed();
});

function renderChunkPreview() {
  const doc = CORPUS.find((d) => d.id === SAMPLE_DOC_ID)!;
  const chunks = chunkDocument(doc.id, doc.title, doc.text, state.chunkConfig);

  let html = "";
  let cursor = 0;
  chunks.forEach((c, i) => {
    if (c.start > cursor) html += escapeHtml(doc.text.slice(cursor, c.start));
    html += `<span class="chunk-span ${i % 2 === 0 ? "even" : "odd"}">${escapeHtml(doc.text.slice(c.start, c.end))}</span>`;
    cursor = c.end;
  });
  if (cursor < doc.text.length) html += escapeHtml(doc.text.slice(cursor));

  el("chunk-preview").innerHTML = `<p class="hint">Sample document: <strong>${escapeHtml(doc.title)}</strong> — ${chunks.length} chunk(s) shown below.</p><div>${html}</div>`;
}

// ---------- retrieval controls ----------

document.querySelectorAll<HTMLInputElement>('input[name="mode"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    state.mode = radio.value as RetrievalMode;
    el("hybrid-weight-label").style.display = state.mode === "hybrid" ? "" : "none";
    if (state.lastQuery) void runQuery();
  });
});

el<HTMLInputElement>("hybrid-weight").addEventListener("input", (e) => {
  state.denseWeight = Number((e.target as HTMLInputElement).value);
  el("hybrid-weight-val").textContent = state.denseWeight.toFixed(1);
  if (state.lastQuery) void runQuery();
});

el<HTMLInputElement>("rerank-toggle").addEventListener("change", (e) => {
  state.rerankEnabled = (e.target as HTMLInputElement).checked;
  if (state.lastQuery) void runQuery();
});

el<HTMLInputElement>("mmr-lambda").addEventListener("input", (e) => {
  state.mmrLambda = Number((e.target as HTMLInputElement).value);
  el("mmr-lambda-val").textContent = state.mmrLambda.toFixed(1);
  if (state.lastQuery) void runQuery();
});

el("run-btn").addEventListener("click", () => void runQuery());
el<HTMLInputElement>("query-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") void runQuery();
});

el("copy-prompt").addEventListener("click", () => {
  const text = el("prompt-box").textContent ?? "";
  navigator.clipboard?.writeText(text).catch(() => {});
});

// ---------- indexing + embedding ----------

async function reindexAndEmbed() {
  const runBtn = el<HTMLButtonElement>("run-btn");
  runBtn.disabled = true;
  state.embedderReady = false;
  el("embedding-status").innerHTML = `Chunking &amp; embedding…<div class="progress-bar"><div id="progress-fill" style="width:0%"></div></div>`;

  const chunks: Chunk[] = [];
  for (const doc of CORPUS) {
    chunks.push(...chunkDocument(doc.id, doc.title, doc.text, state.chunkConfig));
  }
  state.chunks = chunks;
  state.chunksById = new Map(chunks.map((c) => [c.id, c]));
  state.bm25Index = buildBM25Index(chunks.map((c) => ({ id: c.id, text: c.text })));

  const vectors = await embedTexts(
    chunks.map((c) => c.text),
    (status, fraction) => {
      el("embedding-status").innerHTML = `${escapeHtml(status)}…<div class="progress-bar"><div id="progress-fill" style="width:${Math.round(fraction * 100)}%"></div></div>`;
    },
  );
  state.chunkVectors = chunks.map((c, i) => ({ id: c.id, vector: vectors[i] }));
  state.pca = computePCA(vectors);

  el("embedding-status").textContent = `Ready — ${chunks.length} chunks embedded.`;
  renderScatterPlot();

  state.embedderReady = true;
  runBtn.disabled = false;

  if (state.lastQuery) void runQuery();
}

function renderScatterPlot(queryVector?: number[], hitIds?: Set<string>) {
  if (!state.pca) return;
  const points: ScatterPoint[] = state.chunks.map((c, i) => {
    const [x, y] = state.pca!.points[i];
    return {
      x,
      y,
      docId: c.docId,
      docTitle: c.docTitle,
      label: `${c.docTitle}: ${c.text.slice(0, 60)}…`,
      isHit: hitIds?.has(c.id),
    };
  });
  if (queryVector) {
    const [qx, qy] = projectPoint(state.pca, queryVector);
    points.push({ x: qx, y: qy, docId: "__query__", docTitle: "Query", label: "Query", isQuery: true });
  }
  el("scatter-container").innerHTML = renderScatter(points, docIds);
}

// ---------- query pipeline ----------

async function runQuery() {
  const query = el<HTMLInputElement>("query-input").value.trim();
  if (!query || !state.embedderReady) return;
  state.lastQuery = query;

  el("retrieval-results").innerHTML = `<p class="hint">Embedding query &amp; retrieving…</p>`;

  const [queryVector] = await embedTexts([query]);
  state.lastQueryVector = queryVector;

  const denseRanked = cosineTopK(queryVector, state.chunkVectors, state.chunkVectors.length);
  const sparseScoresMap = bm25Score(state.bm25Index!, query);
  const sparseRanked: ScoredId[] = [...sparseScoresMap.entries()]
    .filter(([, score]) => score > 0)
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);

  const denseTopIds = new Set(denseRanked.slice(0, RANK_POOL_FOR_FUSION).map((r) => r.id));
  const sparseTopIds = new Set(sparseRanked.slice(0, RANK_POOL_FOR_FUSION).map((r) => r.id));

  let baseRanked: ScoredId[];
  if (state.mode === "dense") {
    baseRanked = denseRanked;
  } else if (state.mode === "sparse") {
    baseRanked = sparseRanked;
  } else {
    const fused = reciprocalRankFusion([
      { ids: denseRanked.slice(0, RANK_POOL_FOR_FUSION).map((r) => r.id), weight: state.denseWeight },
      { ids: sparseRanked.slice(0, RANK_POOL_FOR_FUSION).map((r) => r.id), weight: 1 - state.denseWeight },
    ]);
    baseRanked = [...fused.entries()].map(([id, score]) => ({ id, score })).sort((a, b) => b.score - a.score);
  }

  if (baseRanked.length === 0) {
    el("retrieval-results").innerHTML = `<p class="no-answer">No matches for this mode (BM25 found no keyword overlap). Try Dense or Hybrid.</p>`;
    el("rerank-results").innerHTML = "";
    el("prompt-box").textContent = "No context retrieved — nothing to assemble.";
    el("token-bar").style.width = "0%";
    el("token-hint").textContent = "";
    el("answer-box").innerHTML = `<p class="no-answer">No confident answer — no matching context was retrieved.</p>`;
    renderScatterPlot(queryVector, new Set());
    return;
  }

  const candidatePoolSize = state.rerankEnabled ? Math.min(RERANK_POOL, baseRanked.length) : Math.min(TOP_K, baseRanked.length);
  const candidatePool = baseRanked.slice(0, candidatePoolSize);
  const prerankOrder = candidatePool.map((r) => r.id);

  let finalIds: string[];
  if (state.rerankEnabled) {
    const maxScore = Math.max(...candidatePool.map((c) => c.score), 1e-9);
    const mmrCandidates = candidatePool.map((c) => ({
      id: c.id,
      vector: state.chunkVectors.find((v) => v.id === c.id)!.vector,
      relevance: c.score / maxScore,
    }));
    finalIds = mmrRerank(mmrCandidates, state.mmrLambda, Math.min(TOP_K, mmrCandidates.length));
  } else {
    finalIds = prerankOrder.slice(0, TOP_K);
  }

  const scoreById = new Map(baseRanked.map((r) => [r.id, r.score]));
  const contextChunks = finalIds.map((id) => state.chunksById.get(id)!);

  renderRetrievalResults(finalIds, scoreById, denseTopIds, sparseTopIds);
  renderRerankPanel(prerankOrder, finalIds);
  renderPrompt(query, contextChunks);
  renderAnswer(query, contextChunks);
  renderScatterPlot(queryVector, new Set(finalIds));
}

function renderRetrievalResults(
  ids: string[],
  scoreById: Map<string, number>,
  denseTopIds: Set<string>,
  sparseTopIds: Set<string>,
) {
  const rows = ids
    .map((id, i) => {
      const chunk = state.chunksById.get(id)!;
      const score = scoreById.get(id) ?? 0;
      const badges =
        state.mode === "hybrid"
          ? `${denseTopIds.has(id) ? '<span class="badge dense">D</span>' : ""}${sparseTopIds.has(id) ? '<span class="badge sparse">S</span>' : ""}`
          : "";
      return `<tr class="result-row" id="result-${i}">
        <td>${i + 1}</td>
        <td>${badges}<strong>${escapeHtml(chunk.docTitle)}</strong><br /><span class="hint">${escapeHtml(chunk.text.slice(0, 110))}…</span></td>
        <td>${score.toFixed(4)}</td>
      </tr>`;
    })
    .join("");

  el("retrieval-results").innerHTML = `<table><thead><tr><th>#</th><th>Chunk</th><th>Score</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderRerankPanel(prerankOrder: string[], finalIds: string[]) {
  if (!state.rerankEnabled) {
    el("rerank-results").innerHTML = `<p class="hint">Reranking is off — results above are the raw retrieval order.</p>`;
    return;
  }
  const rows = finalIds
    .map((id, newIdx) => {
      const oldIdx = prerankOrder.indexOf(id);
      const chunk = state.chunksById.get(id)!;
      let arrow = "→";
      if (oldIdx > newIdx) arrow = `<span class="rank-arrow-up">↑ was #${oldIdx + 1}</span>`;
      else if (oldIdx < newIdx) arrow = `<span class="rank-arrow-down">↓ was #${oldIdx + 1}</span>`;
      else arrow = "= unchanged";
      return `<tr><td>${newIdx + 1}</td><td>${escapeHtml(chunk.docTitle)}</td><td>${arrow}</td></tr>`;
    })
    .join("");
  el("rerank-results").innerHTML = `<table><thead><tr><th>#</th><th>Chunk</th><th>Rank change</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderPrompt(query: string, contextChunks: Chunk[]) {
  const { prompt, estimatedTokens } = assemblePrompt(query, contextChunks);
  el("prompt-box").textContent = prompt;
  const pct = Math.min(100, Math.round((estimatedTokens / TOKEN_BUDGET) * 100));
  el("token-bar").style.width = `${pct}%`;
  el("token-hint").textContent = `~${estimatedTokens} tokens of a ${TOKEN_BUDGET}-token budget (${pct}%)`;
}

function renderAnswer(query: string, contextChunks: Chunk[]) {
  const answer = extractiveAnswer(query, contextChunks);
  if (!answer) {
    el("answer-box").innerHTML = `<p class="no-answer">No confident answer — low term overlap between the question and retrieved context. A real system should say "I don't know" here rather than guess.</p>`;
    return;
  }
  const citationIdx = answer.sourceChunkIndex + 1;
  el("answer-box").innerHTML = `<p>${escapeHtml(answer.sentence)} <span class="citation" data-result="${answer.sourceChunkIndex}">[${citationIdx}]</span></p>`;
}

el("answer-box").addEventListener("mouseover", (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>(".citation");
  if (!target) return;
  const row = document.getElementById(`result-${target.dataset.result}`);
  row?.classList.add("hovered");
});
el("answer-box").addEventListener("mouseout", (e) => {
  const target = (e.target as HTMLElement).closest<HTMLElement>(".citation");
  if (!target) return;
  const row = document.getElementById(`result-${target.dataset.result}`);
  row?.classList.remove("hovered");
});

// ---------- init ----------

updateChunkControlVisibility();
renderChunkPreview();
void reindexAndEmbed();
