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

/** One worksheet of an Excel preview. */
export interface SheetPreview {
  name: string;
  headers: string[];
  rows: CellValue[][];
}

/** Read-only preview of an Excel file (Gantt, KPI): one entry per worksheet, in workbook order. */
export interface WorkbookPreview {
  sheets: SheetPreview[];
}

/** GET /preview/{requestId} */
export interface PreviewResponse {
  info: { html: string };
  gantt: WorkbookPreview;
  kpi: WorkbookPreview;
}

/** Error body returned by the API on 4xx/5xx. */
export interface ApiErrorBody {
  message: string;
}
