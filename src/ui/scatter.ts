export interface ScatterPoint {
  x: number;
  y: number;
  docId: string;
  docTitle: string;
  label: string;
  isQuery?: boolean;
  isHit?: boolean;
}

const PALETTE = [
  "#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#9333ea",
  "#0891b2", "#db2777", "#65a30d", "#ea580c", "#4338ca",
];

export function colorForDoc(docId: string, docIds: string[]): string {
  const idx = docIds.indexOf(docId);
  return PALETTE[idx % PALETTE.length];
}

export function renderScatter(points: ScatterPoint[], docIds: string[]): string {
  const width = 480;
  const height = 320;
  const pad = 24;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const sx = (x: number) => pad + ((x - minX) / spanX) * (width - 2 * pad);
  const sy = (y: number) => height - pad - ((y - minY) / spanY) * (height - 2 * pad);

  const circles = points
    .map((p) => {
      const cx = sx(p.x).toFixed(1);
      const cy = sy(p.y).toFixed(1);
      if (p.isQuery) {
        return `<g><circle cx="${cx}" cy="${cy}" r="8" fill="var(--accent)" stroke="#fff" stroke-width="2" /><title>${escapeXml(p.label)}</title></g>`;
      }
      const color = colorForDoc(p.docId, docIds);
      const ring = p.isHit
        ? `<circle cx="${cx}" cy="${cy}" r="9" fill="none" stroke="var(--accent)" stroke-width="2" />`
        : "";
      return `<g>${ring}<circle cx="${cx}" cy="${cy}" r="5" fill="${color}" opacity="${p.isHit ? 1 : 0.55}" /><title>${escapeXml(p.label)}</title></g>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="2D projection of chunk embeddings">${circles}</svg>`;
}

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]!));
}
