export type ProcessingStatus = 'scanning' | 'extracting' | 'analyzing' | 'generating' | 'done' | 'error';
export const PROCESSING_STATUSES: readonly ProcessingStatus[] = [
  'scanning', 'extracting', 'analyzing', 'generating', 'done', 'error',
];

export interface PdfProcessingJobData {
  requestId: string;
  pdfStoragePath: string;
  /**
   * `extract-only`: stop after PDF -> markdown (no LLM, no documents). Used by the
   * assistant flow, where the code returned to the user lets an external LLM fetch
   * the markdown. Absent = the normal full pipeline.
   */
  mode?: 'extract-only';
}

export interface ExtractOnlyResult {
  markdownStoragePath: string;
  pageCount: number;
  tableCount: number;
  characterCount: number;
}

export interface ProcessingProgress {
  status: ProcessingStatus;
  progress: number;
  message: string;
  markdownStoragePath?: string;
}

export interface PdfProcessingResult {
  markdownStoragePath: string;
  pageCount: number;
  tableCount: number;
  characterCount: number;
  /** Final downloadable files (api-contract.md filenames), not the intermediate LLM JSON. */
  infoStoragePath: string;
  ganttStoragePath: string;
  kpiStoragePath: string;
  previewStoragePath: string;
}
