export type ProcessingStatus = 'scanning' | 'extracting' | 'analyzing' | 'generating' | 'done' | 'error';

export interface PdfProcessingJobData {
  requestId: string;
  pdfStoragePath: string;
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
}
