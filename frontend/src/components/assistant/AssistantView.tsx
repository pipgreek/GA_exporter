"use client";

import { Check, Copy, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";
import { ProgressIndicator } from "@/components/progress/ProgressIndicator";
import { Toaster, useToasts } from "@/components/ui/Toaster";
import { FileThumbnail } from "@/components/upload/FileThumbnail";
import { UploadDropzone } from "@/components/upload/UploadDropzone";
import { ApiError, uploadGrantAgreementForAssistant } from "@/lib/api/client";

type Phase = "idle" | "uploading" | "processing" | "done" | "failed";

export function AssistantView() {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toasts, showError } = useToasts();
  const attempt = useRef(0);

  const busy = phase === "uploading" || phase === "processing";
  const canStart = file !== null && (phase === "idle" || phase === "failed");

  function reset() {
    attempt.current++;
    setFile(null);
    setCode(null);
    setCopied(false);
    setPhase("idle");
  }

  async function start() {
    if (!file || !canStart) return;
    const current = ++attempt.current;
    setCode(null);
    setPhase("uploading");
    try {
      const { requestId } = await uploadGrantAgreementForAssistant(file);
      if (current !== attempt.current) return;
      setCode(requestId);
      setPhase("processing");
    } catch (err) {
      if (current !== attempt.current) return;
      setPhase("failed");
      showError(err instanceof ApiError ? err.message : "Upload failed. Please try again.");
    }
  }

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError("Could not copy. Select the code and copy it manually.");
    }
  }

  return (
    <div className="mt-28 flex w-full max-w-2xl flex-col items-center">
      <Toaster toasts={toasts} />

      <h1 className="mb-2 text-center text-3xl font-extrabold tracking-tight text-slate-900">
        Grant Agreement for the Assistant
      </h1>
      <p className="mb-8 text-center text-sm text-slate-600">
        Upload a Grant Agreement and give the code you get to the assistant.
      </p>

      <div className="mb-8 flex items-start gap-6">
        <UploadDropzone disabled={file !== null} onFileAccepted={setFile} onFileRejected={showError} />
        {file && <FileThumbnail file={file} onRemove={reset} />}
      </div>

      <button
        type="button"
        onClick={start}
        disabled={!canStart}
        className="flex items-center gap-2 rounded-xl bg-sky-600 px-8 py-3 font-semibold text-white shadow-lg shadow-sky-600/20 transition-all hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
      >
        {phase === "uploading" && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        {phase === "failed" ? "Try again" : busy ? "Processing..." : "Get code"}
      </button>

      {code && phase !== "done" && (
        <ProgressIndicator
          key={`progress-${code}`}
          requestId={code}
          onDone={() => setPhase("done")}
          onError={() => setPhase("failed")}
        />
      )}

      {code && phase === "done" && (
        <div className="fade-in mt-10 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-emerald-800">Ready. Give this code to the assistant:</p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <code className="break-all rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm">
              {code}
            </code>
            <button
              type="button"
              onClick={copy}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-700"
            >
              {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-600">The code is valid for 24 hours.</p>
          <button type="button" onClick={reset} className="mt-4 text-sm font-semibold text-sky-700 hover:underline">
            Upload another Grant Agreement
          </button>
        </div>
      )}
    </div>
  );
}
