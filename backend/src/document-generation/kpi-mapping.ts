import { KpiJson } from '../llm/schemas/kpi.schema';
import { monthLabels } from './month-labels';
import { PreviewSheet } from './preview.types';

/**
 * Pure transform implementing llm/schemas/preview-mapping.md "KPI -> one
 * sheet per category". Note: the leading blank header column (mirroring the
 * Gantt Overview sheet's `["", "M1", ...]` id column) is added here so every
 * row's column count matches `headers.length` exactly — the row tuples in
 * the mapping spec are `(label, target, achieved, ...monthlyValues)`, so the
 * header row needs a matching leading slot for `label`.
 */
export function mapKpiToPreviewSheets(kpi: KpiJson): PreviewSheet[] {
  const months = monthLabels(kpi.totalMonths);
  const headers = ['', 'Target', 'Achieved', ...months];

  return kpi.categories.map((category) => {
    const rows: (string | number | null)[][] = [];
    for (const group of category.groups) {
      if (group.label) {
        rows.push([group.label, '', '', ...new Array<null>(months.length).fill(null)]);
      }
      for (const item of group.kpis) {
        const monthlyValues = item.monthlyValues ?? new Array<null>(kpi.totalMonths).fill(null);
        rows.push([item.label, item.target, item.achieved ?? 0, ...monthlyValues]);
      }
    }
    return { name: category.name, headers, rows };
  });
}
