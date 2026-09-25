"use client";

import { CircleAlert, CircleCheck, FileArchive, LoaderCircle, RefreshCw, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ExcelViewer } from "@/components/preview/ExcelViewer";
import { PreviewErrorBoundary } from "@/components/preview/PreviewErrorBoundary";
import { PreviewModal } from "@/components/preview/PreviewModal";
import { WordViewer } from "@/components/preview/WordViewer";
import { ApiError, getDownloadAllUrl, getDownloadUrl, getPreview } from "@/lib/api/client";
import type { FileType, PreviewResponse } from "@/lib/api/types";
import { GENERATED_FILES, getGeneratedFile, ZIP_FILE_NAME } from "@/lib/files";
import { FileCard } from "./FileCard";

type PreviewState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; preview: PreviewResponse };

function PreviewBody({ type, state, onRetry }: { type: FileType; state: PreviewState; onRetry: () => void }) {
  if (state.kind === "idle" || state.kind === "loading") {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500" aria-busy="true">
        <LoaderCircle className="size-5 animate-spin text-sky-600" aria-hidden /> Loading preview...
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div role="alert" className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-rose-800">
        <CircleAlert className="size-6 text-rose-600" aria-hidden />
        <p className="font-semibold">Could not load the preview</p>
        <p className="text-rose-700">{state.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 inline-flex cursor-pointer items-center gap-1.5 font-semibold text-rose-700 hover:text-rose-900"
        >
          <RotateCcw className="size-4" aria-hidden /> Retry
        </button>
      </div>
    );
  }

  const { preview } = state;
  return (
    <PreviewErrorBoundary>
      {type === "info" ? (
        <WordViewer html={preview.info.html} />
      ) : (
        <ExcelViewer key={type} workbook={preview[type]} caption={getGeneratedFile(type).title} />
      )}
    </PreviewErrorBoundary>
  );
}

/**
 * Shown on the home page once processing is done (option B, 2026-09-25):
 * the three generated files appear directly as cards; previewing is optional.
 * GET /preview is only called the first time the user opens a preview.
 * Mount with `key={requestId}`.
 */
export function ResultsSection({
  requestId,
  onStartOver,
}: {
  requestId: string;
  /** "Process another Grant Agreement" (replaces "Return to Home Page"). */
  onStartOver: () => void;
}) {
  const [preview, setPreview] = useState<PreviewState>({ kind: "idle" });
  const [open, setOpen] = useState<FileType | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  function loadPreview() {
    setPreview({ kind: "loading" });
    getPreview(requestId)
      .then((p) => mounted.current && setPreview({ kind: "ready", preview: p }))
      .catch((err: unknown) => {
        if (!mounted.current) return;
        const message = err instanceof ApiError ? err.message : "Could not load the preview.";
        setPreview({ kind: "error", message });
      });
  }

  function openPreview(type: FileType) {
    setOpen(type);
    if (preview.kind === "idle" || preview.kind === "error") loadPreview();
  }

  return (
    <section aria-labelledby="results-heading" className="fade-in mt-12 w-full">
      <div className="mb-8 flex w-full items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-center font-medium text-emerald-800 shadow-sm">
        <CircleCheck className="size-5 shrink-0 text-emerald-600" aria-hidden />
        <h2 id="results-heading">Your analysis is complete. Your files are ready for download.</h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {GENERATED_FILES.map((file) => (
          <FileCard
            key={file.type}
            file={file}
            downloadUrl={getDownloadUrl(requestId, file.type)}
            onPreview={() => openPreview(file.type)}
          />
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <a
          href={getDownloadAllUrl(requestId)}
          download={ZIP_FILE_NAME}
          className="flex items-center gap-2 rounded-xl bg-sky-600 px-8 py-3 font-semibold text-white shadow-lg shadow-sky-600/20 transition-all hover:bg-sky-700"
        >
          <FileArchive className="size-5" aria-hidden /> Download all (.zip)
        </a>
        <button
          type="button"
          onClick={onStartOver}
          className="flex cursor-pointer items-center gap-2 font-semibold text-sky-600 transition hover:text-sky-800"
        >
          <RefreshCw className="size-4" aria-hidden /> Process another Grant Agreement
        </button>
      </div>

      <PreviewModal
        open={open !== null}
        onOpenChange={(isOpen) => !isOpen && setOpen(null)}
        title={open ? getGeneratedFile(open).title : ""}
      >
        {open && <PreviewBody type={open} state={preview} onRetry={loadPreview} />}
      </PreviewModal>
    </section>
  );
}
