// Types for the backend ↔ frontend API contract (docs/implementation-plan.md §6).
// Keep in sync with the backend; the mock backend in src/mocks implements the same shapes.

export type ProcessingStatus =
  | "scanning"
  | "extracting"
  | "analyzing"
  | "generating"
  | "done"
  | "error";

export type FileType = "info" | "gantt" | "kpi";

/** POST /upload */
export interface UploadResponse {
  requestId: string;
}

/** GET /status/{requestId} */
export interface StatusResponse {
  status: ProcessingStatus;
  /** 0–100 */
  progress: number;
  message: string;
}

export type CellValue = string | number | null;

/** Read-only table for the Excel previews (Gantt, KPI). */
export interface TablePreview {
  headers: string[];
  rows: CellValue[][];
}

/** GET /preview/{requestId} */
export interface PreviewResponse {
  info: { html: string };
  gantt: TablePreview;
  kpi: TablePreview;
}

/** Error body returned by the API on 4xx/5xx. */
export interface ApiErrorBody {
  message: string;
}
