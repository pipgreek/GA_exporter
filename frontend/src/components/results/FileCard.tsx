"use client";

import { Eye } from "lucide-react";
import type { GeneratedFile } from "@/lib/files";

interface FileCardProps {
  file: GeneratedFile;
  onPreview: () => void;
}

/** One generated file: name, format and an optional read-only Preview. */
export function FileCard({ file, onPreview }: FileCardProps) {
  const { title, format, icon: Icon, tone } = file;

  return (
    <article
      className={`flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${tone.hoverBorder}`}
    >
      <div className={`mb-4 flex size-14 items-center justify-center rounded-xl ${tone.icon}`}>
        <Icon className="size-7" aria-hidden />
      </div>
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <p className="mb-5 text-xs text-slate-500">{format}</p>

      <div className="mt-auto flex w-full flex-col gap-2">
        {/* Download button: step D. */}
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
