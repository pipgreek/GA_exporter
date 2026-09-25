import type { CellValue, TablePreview } from "@/lib/api/types";

interface ExcelViewerProps {
  table: TablePreview;
  /** Accessible name of the table, e.g. "Gantt Chart". */
  caption: string;
}

function formatCell(value: CellValue): string {
  if (value === null) return "";
  if (typeof value === "number") return value.toLocaleString("en-US");
  return value;
}

/** Read-only table preview for the Excel files (Gantt, KPI). */
export function ExcelViewer({ table, caption }: ExcelViewerProps) {
  if (table.rows.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">This sheet has no rows.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="sticky top-0 bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
          <tr>
            {table.headers.map((header, i) => (
              <th key={i} scope="col" className="whitespace-nowrap border-b border-slate-200 px-3 py-2 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r} className="odd:bg-white even:bg-slate-50/70">
              {table.headers.map((_, c) => {
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
