"use client";

import { CircleAlert, CircleCheck } from "lucide-react";
import { useProcessingStatus } from "@/hooks/useProcessingStatus";

interface ProgressIndicatorProps {
  requestId: string;
  onDone: () => void;
  onError: (message: string) => void;
}

/** Progress bar + status message. Mount with `key={requestId}`. */
export function ProgressIndicator({ requestId, onDone, onError }: ProgressIndicatorProps) {
  const { status, progress, message } = useProcessingStatus(requestId, { onDone, onError });

  if (status === "error") {
    return (
      <div
        role="alert"
        className="fade-in mt-10 flex w-full max-w-md items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800 shadow-sm"
      >
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-rose-600" aria-hidden />
        <div>
          <p className="font-semibold">Processing failed</p>
          <p className="mt-1 text-rose-700">{message}</p>
        </div>
      </div>
    );
  }

  const done = status === "done";
  const tone = done ? "text-emerald-600" : "text-sky-600";

  return (
    <div className="fade-in mt-10 flex w-full max-w-md flex-col items-center">
      <div className="mb-2 flex w-full justify-between gap-4">
        <span aria-live="polite" className={`flex items-center gap-1.5 text-sm font-semibold ${tone}`}>
          {done && <CircleCheck className="size-4" aria-hidden />}
          {message}
        </span>
        <span className={`text-sm font-bold tabular-nums ${tone}`}>{progress}%</span>
      </div>
      <div
        role="progressbar"
        aria-label="Processing progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="h-3 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner"
      >
        <div
          className={`h-3 rounded-full bg-gradient-to-r transition-all duration-500 ${
            done ? "from-emerald-500 to-emerald-400" : "from-sky-500 to-cyan-500"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
