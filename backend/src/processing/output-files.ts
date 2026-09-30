// Filenames/content-types match docs/api-contract.md exactly — these are
// also the exact storage paths the worker writes to (pdf-processing.processor.ts),
// so preview/download just stream what's already there, no renaming.
export type DownloadFileType = 'info' | 'gantt' | 'kpi';

export interface OutputFileSpec {
  storageFilename: string;
  contentType: string;
}

export const OUTPUT_FILES: Record<DownloadFileType, OutputFileSpec> = {
  info: {
    storageFilename: 'INFO_Generation.docx',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  gantt: {
    storageFilename: 'Gantt_Chart.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  kpi: {
    storageFilename: 'KPI_Monitoring.xlsx',
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
};

export function isDownloadFileType(value: string): value is DownloadFileType {
  return value === 'info' || value === 'gantt' || value === 'kpi';
}

export function outputStoragePath(requestId: string, fileType: DownloadFileType): string {
  return `${requestId}/output/${OUTPUT_FILES[fileType].storageFilename}`;
}

export function previewStoragePath(requestId: string): string {
  return `${requestId}/output/preview.json`;
}
