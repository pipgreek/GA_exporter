"use client";

import { Expand, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PreviewErrorBoundary } from "./PreviewErrorBoundary";

export interface PreviewTone {
  icon: string;
  hoverBorder: string;
  hoverText: string;
}

interface PreviewCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  tone: PreviewTone;
  onExpand: () => void;
  /** Miniature of the preview content (non-interactive). */
  children: ReactNode;
}

/** One of the three read-only preview cards; expand opens the 90% modal. */
export function PreviewCard({ title, subtitle, icon: Icon, tone, onExpand, children }: PreviewCardProps) {
  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/85 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${tone.hoverBorder}`}
    >
      <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tone.icon}`}>
          <Icon className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-800">{title}</h3>
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onExpand}
          aria-label={`Expand ${title} preview`}
          title="Expand"
          className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 ${tone.hoverText}`}
        >
          <Expand className="size-4" aria-hidden />
        </button>
      </header>

      {/* Miniature: scaled-down, clipped, fades out at the bottom. Clicking it also
          expands; keyboard users use the Expand button above. */}
      <div
        onClick={onExpand}
        aria-hidden
        className="relative h-52 cursor-zoom-in overflow-hidden bg-slate-50"
      >
        <div className="pointer-events-none w-[200%] origin-top-left scale-50 p-4">
          <PreviewErrorBoundary>{children}</PreviewErrorBoundary>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" />
      </div>
    </article>
  );
}
