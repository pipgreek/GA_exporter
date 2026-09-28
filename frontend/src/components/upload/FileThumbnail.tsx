"use client";

import { FileText, X } from "lucide-react";

interface FileThumbnailProps {
  file: File;
  onRemove: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileThumbnail({ file, onRemove }: FileThumbnailProps) {
  return (
    <div className="fade-in relative mt-7 flex h-36 w-28 flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 shadow-sm">
      <FileText className="mb-2 size-8 text-rose-500" aria-hidden />
      <span className="w-full truncate px-2 text-center text-xs font-medium text-slate-700" title={file.name}>
        {file.name}
      </span>
      <span className="text-[10px] text-slate-400">{formatSize(file.size)}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute -right-2 -top-2 flex size-7 cursor-pointer items-center justify-center rounded-full border border-slate-100 bg-white text-slate-400 shadow-md transition hover:text-rose-600"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
