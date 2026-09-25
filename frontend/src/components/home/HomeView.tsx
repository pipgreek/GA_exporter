"use client";

import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useRef, useState } from "react";
import { HomeIntro } from "@/components/home/HomeIntro";
import { ResultsSection } from "@/components/results/ResultsSection";
import { ProgressIndicator } from "@/components/progress/ProgressIndicator";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Toaster, useToasts } from "@/components/ui/Toaster";
import { FileThumbnail } from "@/components/upload/FileThumbnail";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { ApiError, uploadGrantAgreement } from "@/lib/api/client";

/**
 * idle       → no processing started (file may or may not be selected)
 * uploading  → POST /upload in flight
 * processing → polling /status
 * done       → files ready: ResultsSection (cards + optional preview)
 * failed     → upload or processing failed; Start becomes "Try again"
 */
type Phase = "idle" | "uploading" | "processing" | "done" | "failed";

export function HomeView() {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const { toasts, showError } = useToasts();
  // Ignores an upload response that arrives after the file was removed.
  const attempt = useRef(0);

  const busy = phase === "uploading" || phase === "processing";
  const canStart = file !== null && (phase === "idle" || phase === "failed");

  function reset() {
    attempt.current++;
    setFile(null);
    setRequestId(null);
    setPhase("idle");
  }

  async function start() {
    if (!file || !canStart) return;
    const current = ++attempt.current;
    setRequestId(null);
    setPhase("uploading");
    try {
      const { requestId } = await uploadGrantAgreement(file);
      if (current !== attempt.current) return;
      setRequestId(requestId);
      setPhase("processing");
    } catch (err) {
      if (current !== attempt.current) return;
      setPhase("failed");
      showError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    }
  }

  return (
    <div className="mt-28 flex w-full max-w-4xl flex-col items-center">
      <Toaster toasts={toasts} />

      <h1 className="mb-8 text-center text-3xl font-extrabold tracking-tight text-slate-900">
        Grant Agreement Processing
      </h1>

      <div className="mb-8 flex items-start gap-6">
        <UploadDropzone
          disabled={file !== null}
          onFileAccepted={setFile}
          onFileRejected={showError}
        />
        {file && <FileThumbnail file={file} onRemove={() => setConfirmRemoveOpen(true)} />}
      </div>

      <button
        type="button"
        onClick={start}
        disabled={!canStart}
        className="flex items-center gap-2 rounded-xl bg-sky-600 px-8 py-3 font-semibold text-white shadow-lg shadow-sky-600/20 transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {phase === "uploading" && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        {phase === "failed" ? "Try again" : busy ? "Processing..." : "Start Processing"}
      </button>

      {phase === "idle" && <HomeIntro />}

      {requestId && (
        <ProgressIndicator
          key={`progress-${requestId}`}
          requestId={requestId}
          onDone={() => setPhase("done")}
          onError={() => setPhase("failed")}
        />
      )}

      {requestId && phase === "done" && (
        <ResultsSection key={`results-${requestId}`} requestId={requestId} />
      )}

      <ConfirmDialog
        open={confirmRemoveOpen}
        onOpenChange={setConfirmRemoveOpen}
        onConfirm={reset}
        tone="danger"
        icon={<TriangleAlert className="size-5" aria-hidden />}
        title="Remove file?"
        description={
          busy
            ? "Processing is in progress. Removing the file will cancel it."
            : "Are you sure you want to remove the uploaded file?"
        }
        confirmLabel="Yes, Remove"
      />
    </div>
  );
}
