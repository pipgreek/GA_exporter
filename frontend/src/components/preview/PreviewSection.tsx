"use client";

import { ChartNoAxesGantt, CircleAlert, FileText, RotateCcw, Table } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, getPreview } from "@/lib/api/client";
import type { FileType, PreviewResponse } from "@/lib/api/types";
import { ExcelViewer } from "./ExcelViewer";
import { PreviewCard, type PreviewTone } from "./PreviewCard";
import { PreviewErrorBoundary } from "./PreviewErrorBoundary";
import { PreviewModal } from "./PreviewModal";
import { WordViewer } from "./WordViewer";

const FILES: { type: FileType; title: string; icon: typeof FileText; tone: PreviewTone }[] = [
  {
    type: "info",
    title: "INFO Generation",
    icon: FileText,
    tone: { icon: "bg-sky-50 text-sky-600", hoverBorder: "hover:border-sky-300", hoverText: "hover:text-sky-600" },
  },
  {
    type: "gantt",
    title: "Gantt Chart",
    icon: ChartNoAxesGantt,
    tone: { icon: "bg-emerald-50 text-emerald-600", hoverBorder: "hover:border-emerald-300", hoverText: "hover:text-emerald-600" },
  },
  {
    type: "kpi",
    title: "KPI Monitoring",
    icon: Table,
    tone: { icon: "bg-indigo-50 text-indigo-600", hoverBorder: "hover:border-indigo-300", hoverText: "hover:text-indigo-600" },
  },
];

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; preview: PreviewResponse };

function subtitleFor(type: FileType, preview: PreviewResponse): string {
  if (type === "info") return "Word (.docx)";
  const rows = preview[type].rows.length;
  return `Excel (.xlsx) · ${rows} ${rows === 1 ? "row" : "rows"}`;
}

function PreviewContent({ type, preview }: { type: FileType; preview: PreviewResponse }) {
  if (type === "info") return <WordViewer html={preview.info.html} />;
  const title = FILES.find((f) => f.type === type)!.title;
  return <ExcelViewer table={preview[type]} caption={title} />;
}

/**
 * Loads GET /preview/{requestId} and shows the three read-only previews side by
 * side, below the upload area. Mount with `key={requestId}`.
 */
export function PreviewSection({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState<FileType | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPreview(requestId)
      .then((preview) => !cancelled && setState({ kind: "ready", preview }))
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "Could not load the previews.";
        setState({ kind: "error", message });
      });
    return () => {
      cancelled = true;
    };
  }, [requestId, attempt]);

  function retry() {
    setState({ kind: "loading" });
    setAttempt((a) => a + 1);
  }

  const expandedFile = FILES.find((f) => f.type === expanded);

  return (
    <section aria-labelledby="previews-heading" className="fade-in mt-12 w-full">
      <h2 id="previews-heading" className="mb-6 text-center text-2xl font-bold text-slate-900">
        Previews Generated
      </h2>

      {state.kind === "loading" && (
        <div className="grid gap-6 md:grid-cols-3" aria-busy="true" aria-label="Loading previews">
          {FILES.map((f) => (
            <div key={f.type} className="h-[17rem] animate-pulse rounded-2xl border border-slate-200 bg-white/70" />
          ))}
        </div>
      )}

      {state.kind === "error" && (
        <div
          role="alert"
          className="mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-rose-600" aria-hidden />
          <div className="flex-1">
            <p className="font-semibold">Could not load the previews</p>
            <p className="mt-1 text-rose-700">{state.message}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-3 inline-flex cursor-pointer items-center gap-1.5 font-semibold text-rose-700 hover:text-rose-900"
            >
              <RotateCcw className="size-4" aria-hidden /> Retry
            </button>
          </div>
        </div>
      )}

      {state.kind === "ready" && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            {FILES.map((f) => (
              <PreviewCard
                key={f.type}
                title={f.title}
                subtitle={subtitleFor(f.type, state.preview)}
                icon={f.icon}
                tone={f.tone}
                onExpand={() => setExpanded(f.type)}
              >
                <PreviewContent type={f.type} preview={state.preview} />
              </PreviewCard>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => router.push(`/result?requestId=${encodeURIComponent(requestId)}`)}
              className="cursor-pointer rounded-xl bg-emerald-600 px-8 py-3 font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700"
            >
              Confirm &amp; Proceed
            </button>
          </div>

          <PreviewModal
            open={expanded !== null}
            onOpenChange={(open) => !open && setExpanded(null)}
            title={expandedFile?.title ?? ""}
          >
            {expanded && (
              <PreviewErrorBoundary>
                <PreviewContent type={expanded} preview={state.preview} />
              </PreviewErrorBoundary>
            )}
          </PreviewModal>
        </>
      )}
    </section>
  );
}
