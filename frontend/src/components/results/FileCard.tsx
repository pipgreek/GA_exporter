"use client";

import { Download, Eye } from "lucide-react";
import type { GeneratedFile } from "@/lib/files";

interface FileCardProps {
  file: GeneratedFile;
  /** GET /download/{requestId}/{type} */
  downloadUrl: string;
  onPreview: () => void;
}

/** One generated file: name, Download and an optional read-only Preview. */
export function FileCard({ file, downloadUrl, onPreview }: FileCardProps) {
  const { title, fileName, format, icon: Icon, tone } = file;

  return (
    <article
      className={`flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${tone.hoverBorder}`}
    >
      <div className={`mb-4 flex size-14 items-center justify-center rounded-xl ${tone.icon}`}>
        <Icon className="size-7" aria-hidden />
      </div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <p className="w-full truncate text-sm text-slate-600" title={fileName}>
        {fileName}
      </p>
      <p className="mb-5 text-xs text-slate-400">{format}</p>

      <div className="mt-auto flex w-full flex-col gap-2">
        {/* The backend's Content-Disposition header makes the browser save the file. */}
        <a
          href={downloadUrl}
          download={fileName}
          aria-label={`Download ${fileName}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/20 transition-all hover:bg-sky-700"
        >
          <Download className="size-4" aria-hidden /> Download
        </a>
        <button
          type="button"
          onClick={onPreview}
          aria-label={`Preview ${title}`}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-all hover:border-sky-300 hover:text-sky-600"
        >
          <Eye className="size-4" aria-hidden /> Preview
        </button>
      </div>
    </article>
  );
}
