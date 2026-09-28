import { GanttJson } from '../llm/schemas/gantt.schema';
import { KpiJson } from '../llm/schemas/kpi.schema';

/**
 * Render-engine capacity decision (implementation-plan.md §7, 2026-09-28).
 *
 * Month/sheet counts are generated dynamically from the validated JSON (not a
 * fixed-width pre-built template — Excel column count and KPI sheet count are
 * inherently data-driven per GA), so there is no *technical* upper bound. These
 * constants are instead sanity guards: Horizon Europe/Euratom grants are
 * practically always within these bounds, so exceeding one is a much stronger
 * signal of an extraction error than a genuine outlier project. Exceeding a
 * limit fails the job (status `error`) rather than silently truncating data.
 */
export const MAX_TOTAL_MONTHS = 48;
export const MAX_WORK_PACKAGES = 30;
export const MAX_KPI_CATEGORIES = 40;

export function assertGanttWithinRenderLimits(gantt: GanttJson): void {
  if (gantt.totalMonths > MAX_TOTAL_MONTHS) {
    throw new Error(
      `Gantt totalMonths (${gantt.totalMonths}) exceeds the render engine's maximum of ${MAX_TOTAL_MONTHS}.`,
    );
  }
  if (gantt.workPackages.length > MAX_WORK_PACKAGES) {
    throw new Error(
      `Gantt workPackages count (${gantt.workPackages.length}) exceeds the render engine's maximum of ${MAX_WORK_PACKAGES}.`,
    );
  }
}

export function assertKpiWithinRenderLimits(kpi: KpiJson): void {
  if (kpi.totalMonths > MAX_TOTAL_MONTHS) {
    throw new Error(`KPI totalMonths (${kpi.totalMonths}) exceeds the render engine's maximum of ${MAX_TOTAL_MONTHS}.`);
  }
  if (kpi.categories.length > MAX_KPI_CATEGORIES) {
    throw new Error(
      `KPI categories count (${kpi.categories.length}) exceeds the render engine's maximum of ${MAX_KPI_CATEGORIES}.`,
    );
  }
}
