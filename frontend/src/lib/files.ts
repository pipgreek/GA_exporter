import { ChartNoAxesGantt, FileText, Table, type LucideIcon } from "lucide-react";
import type { FileType } from "@/lib/api/types";

export interface GeneratedFile {
  type: FileType;
  title: string;
  /** File name shown on the card and returned by the backend Content-Disposition header. */
  fileName: string;
  /** Short format label, e.g. "Word (.docx)". */
  format: string;
  icon: LucideIcon;
  tone: {
    /** Icon tile background + colour. */
    icon: string;
    hoverBorder: string;
  };
}

export const ZIP_FILE_NAME = "GA_Exporter_files.zip";
export const MAX_PDF_UPLOAD_BYTES = 25 * 1024 * 1024;

/** The three files generated from a Grant Agreement, in display order. */
export const GENERATED_FILES: GeneratedFile[] = [
  {
    type: "info",
    title: "INFO Generation",
    fileName: "INFO_Generation.docx",
    format: "Word (.docx)",
    icon: FileText,
    tone: { icon: "bg-sky-50 text-sky-600", hoverBorder: "hover:border-sky-300" },
  },
  {
    type: "gantt",
    title: "Gantt Chart",
    fileName: "Gantt_Chart.xlsx",
    format: "Excel (.xlsx)",
    icon: ChartNoAxesGantt,
    tone: { icon: "bg-emerald-50 text-emerald-600", hoverBorder: "hover:border-emerald-300" },
  },
  {
    type: "kpi",
    title: "KPI Monitoring",
    fileName: "KPI_Monitoring.xlsx",
    format: "Excel (.xlsx)",
    icon: Table,
    tone: { icon: "bg-indigo-50 text-indigo-600", hoverBorder: "hover:border-indigo-300" },
  },
];

export function getGeneratedFile(type: FileType): GeneratedFile {
  return GENERATED_FILES.find((f) => f.type === type)!;
}
