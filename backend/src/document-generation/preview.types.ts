// Mirrors the preview shape from docs/api-contract.md and llm/schemas/preview-mapping.md.
export interface PreviewSheet {
  name: string;
  headers: string[];
  rows: (string | number | null)[][];
}

export interface PreviewResponse {
  info: { html: string };
  gantt: { sheets: PreviewSheet[] };
  kpi: { sheets: PreviewSheet[] };
}
