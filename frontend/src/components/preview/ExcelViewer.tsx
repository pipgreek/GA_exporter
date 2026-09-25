"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import type { CellValue, SheetPreview, WorkbookPreview } from "@/lib/api/types";

interface ExcelViewerProps {
  workbook: WorkbookPreview;
  /** Accessible name of the workbook, e.g. "Gantt Chart". */
  caption: string;
}

function formatCell(value: CellValue): string {
  if (value === null) return "";
  if (typeof value === "number") return value.toLocaleString("en-US");
  return value;
}

function SheetTable({ sheet, caption }: { sheet: SheetPreview; caption: string }) {
  if (sheet.rows.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">This sheet has no rows.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {sheet.headers.map((header, i) => (
              <th key={i} scope="col" className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sheet.rows.map((row, r) => (
            <tr key={r} className="odd:bg-white even:bg-slate-50/70">
              {sheet.headers.map((_, c) => {
                const value = row[c] ?? null;
                return (
                  <td
                    key={c}
                    className={`border-b border-slate-100 px-3 py-2 text-slate-700 ${
                      typeof value === "number" ? "text-right tabular-nums" : ""
                    }`}
                  >
                    {formatCell(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Read-only preview of an Excel file (Gantt, KPI). One tab per worksheet,
 * like Excel's sheet tabs; tabs are hidden when there is a single sheet.
 */
export function ExcelViewer({ workbook, caption }: ExcelViewerProps) {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();
  const { sheets } = workbook;

  if (sheets.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">This file has no sheets.</p>;
  }
  const current = Math.min(active, sheets.length - 1);

  if (sheets.length === 1) {
    return <SheetTable sheet={sheets[0]} caption={`${caption} — ${sheets[0].name}`} />;
  }

  // Arrow keys move between tabs (WAI-ARIA tabs pattern).
  function onTabKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (current + delta + sheets.length) % sheets.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={`${caption} sheets`}
        className="mb-3 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-slate-200"
      >
        {sheets.map((sheet, i) => {
          const selected = i === current;
          return (
            <button
              key={i}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={onTabKeyDown}
              className={`shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold transition ${
                selected
                  ? "border-sky-600 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {sheet.name}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${baseId}-panel`} aria-labelledby={`${baseId}-tab-${current}`}>
        <SheetTable sheet={sheets[current]} caption={`${caption} — ${sheets[current].name}`} />
      </div>
    </div>
  );
}
