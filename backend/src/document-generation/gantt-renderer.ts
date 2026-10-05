import { Workbook, Worksheet } from 'exceljs';
import { GanttJson } from '../llm/schemas/gantt.schema';
import {
  applyGridBorders,
  autoSizeColumns,
  sanitizeSheetName,
  setFill,
  styleHeaderRow,
  uniqueSheetName,
  writeSheet,
} from './excel-render-utils';
import {
  deliverableStyle,
  HEADER_BAND_FILL,
  HEADER_FONT_COLOR,
  LABEL_COLUMN_WIDTH,
  MILESTONE_FILL,
  MILESTONE_FONT_COLOR,
  MONTH_COLUMN_WIDTH,
  TASK_ACTIVE_FILL,
  WP_FILL,
  YEAR_BAND_COLORS,
} from './excel-style';
import { mapGanttToPreviewSheets } from './gantt-mapping';
import { monthLabel, yearBandLabel } from './month-labels';
import { PreviewSheet } from './preview.types';
import { assertGanttWithinRenderLimits } from './render-limits';

export interface RenderedGanttExcel {
  buffer: Buffer;
  sheets: PreviewSheet[];
}

export async function renderGanttExcel(gantt: GanttJson): Promise<RenderedGanttExcel> {
  assertGanttWithinRenderLimits(gantt);
  // Preview keeps the flat text-marker representation (WP/T/id strings) —
  // the frontend has no cell-color data, so it signals activity via text.
  // The .xlsx below is a separate, richer rendering of the same JSON: cell
  // *fills* carry the signal there (matching a real VILABS-produced Gantt
  // workbook used as a visual reference, 2026-09-30), with no redundant text
  // in non-marker cells. Both come from the same validated JSON, just
  // formatted for their own medium.
  const sheets = mapGanttToPreviewSheets(gantt);
  const [, deliverablesSheet, milestonesSheet] = sheets;

  const workbook = new Workbook();
  workbook.creator = 'GA Exporter';
  workbook.created = new Date();

  buildOverviewSheet(workbook, gantt);

  const usedNames = new Set<string>([sanitizeSheetName(sheets[0].name).toLowerCase()]);
  for (const sheet of [deliverablesSheet, milestonesSheet]) {
    const name = uniqueSheetName(sanitizeSheetName(sheet.name), usedNames);
    const worksheet = workbook.addWorksheet(name);
    writeSheet(worksheet, sheet);
    styleHeaderRow(worksheet);
    autoSizeColumns(worksheet);
  }

  const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  return { buffer, sheets };
}

function buildOverviewSheet(workbook: Workbook, gantt: GanttJson): Worksheet {
  const { totalMonths, workPackages, milestones, deliverables, reportingPeriods, projectStartDate } = gantt;
  const ws = workbook.addWorksheet(sanitizeSheetName(`M1-M${totalMonths} Overview`));

  ws.getColumn(1).width = LABEL_COLUMN_WIDTH;
  for (let m = 1; m <= totalMonths; m++) ws.getColumn(1 + m).width = MONTH_COLUMN_WIDTH;

  writeLegendRows(ws);
  writeYearAndMonthHeaders(ws, totalMonths, projectStartDate);
  writeReportingPeriodsRow(ws, totalMonths, reportingPeriods);

  const milestonesById = new Map(milestones.map((m) => [m.id, m]));
  const deliverablesByWp = new Map<string, GanttJson['deliverables']>();
  for (const d of deliverables) {
    const list = deliverablesByWp.get(d.wp) ?? [];
    list.push(d);
    deliverablesByWp.set(d.wp, list);
  }

  let rowIndex = 6;
  for (const wp of workPackages) {
    const wpRow = ws.getRow(rowIndex);
    const wpLabelCell = wpRow.getCell(1);
    wpLabelCell.value = wp.id;
    wpLabelCell.font = { bold: true };

    // A WP can have multiple milestones due the same month (e.g. an ethics
    // board and a security board both mobilized in month 6) — collect all
    // ids per month rather than overwriting, and join them like the
    // reference workbook does ("MS1 & MS2").
    const dueMonthToMilestoneIds = new Map<number, string[]>();
    for (const id of wp.milestoneIds ?? []) {
      const milestone = milestonesById.get(id);
      if (!milestone) continue;
      const ids = dueMonthToMilestoneIds.get(milestone.dueMonth) ?? [];
      ids.push(milestone.id);
      dueMonthToMilestoneIds.set(milestone.dueMonth, ids);
    }

    const wpRowMilestoneMonths = new Set<number>();
    for (let m = 1; m <= totalMonths; m++) {
      const cell = wpRow.getCell(1 + m);
      const milestoneIds = dueMonthToMilestoneIds.get(m);
      if (milestoneIds && milestoneIds.length > 0) {
        cell.value = milestoneIds.join(' & ');
        setFill(cell, MILESTONE_FILL);
        cell.font = { bold: true, color: { argb: MILESTONE_FONT_COLOR } };
        wpRowMilestoneMonths.add(m);
      } else if (m >= wp.monthFrom && m <= wp.monthTo) {
        setFill(cell, WP_FILL);
      }
    }
    rowIndex += 1;

    const taskRowByTaskId = new Map<string, ReturnType<typeof ws.getRow>>();
    for (const task of wp.tasks) {
      const taskRow = ws.getRow(rowIndex);
      taskRowByTaskId.set(task.id, taskRow);
      const taskLabelCell = taskRow.getCell(1);
      taskLabelCell.value = task.id;
      taskLabelCell.font = { bold: true };

      const activeMonths = new Set<number>();
      for (const phase of task.phases) {
        for (let m = phase.monthFrom; m <= phase.monthTo; m++) activeMonths.add(m);
      }
      for (const m of activeMonths) {
        if (m >= 1 && m <= totalMonths) setFill(taskRow.getCell(1 + m), TASK_ACTIVE_FILL);
      }
      rowIndex += 1;
    }

    // Deliverables only carry a wp reference in the schema; taskId is set by
    // the LLM only when confidently determinable from the text (see
    // gantt.schema.json). When present and it names one of this WP's own
    // tasks, place the marker on that task's row (matches the reference
    // workbook); otherwise fall back to the WP's own row, which is always
    // correct even if less precise — never guess a task (implementation-plan.md §7).
    const wpDeliverables = deliverablesByWp.get(wp.id) ?? [];
    for (const d of wpDeliverables) {
      if (d.dueMonth < 1 || d.dueMonth > totalMonths) continue;
      const onWpRow = !d.taskId || !taskRowByTaskId.has(d.taskId);
      const targetRow = onWpRow ? wpRow : taskRowByTaskId.get(d.taskId as string)!;
      const cell = targetRow.getCell(1 + d.dueMonth);
      cell.value = cell.value ? `${cell.value} & ${d.id}` : d.id;
      // A milestone sharing this WP-row cell takes styling precedence — it's
      // the rarer, typically more significant marker; the deliverable id is
      // still appended to the text either way, just not re-colored.
      if (!(onWpRow && wpRowMilestoneMonths.has(d.dueMonth))) {
        const style = deliverableStyle(d.disseminationLevel);
        setFill(cell, style.fill);
        cell.font = { bold: true, color: { argb: style.font } };
      }
    }
  }

  applyGridBorders(ws, 4, 1 + totalMonths, rowIndex - 1);
  applyReportingPeriodSeparators(ws, totalMonths, reportingPeriods, 3, rowIndex - 1);
  return ws;
}

function writeLegendRows(ws: Worksheet): void {
  ws.getCell(1, 1).value = 'D=DELIVERABLE';
  ws.getCell(1, 1).font = { bold: true };

  const publicCell = ws.getCell(1, 2);
  publicCell.value = 'Public';
  const publicStyle = deliverableStyle('PU');
  setFill(publicCell, publicStyle.fill);
  publicCell.font = { bold: true, color: { argb: publicStyle.font } };

  const sensitiveCell = ws.getCell(1, 3);
  sensitiveCell.value = 'Sensitive';
  const sensitiveStyle = deliverableStyle('SEN');
  setFill(sensitiveCell, sensitiveStyle.fill);
  sensitiveCell.font = { bold: true, color: { argb: sensitiveStyle.font } };

  ws.getCell(2, 1).value = 'MS=MILESTONE';
  ws.getCell(2, 1).font = { bold: true };
}

function writeYearAndMonthHeaders(ws: Worksheet, totalMonths: number, projectStartDate?: string): void {
  const yearCount = Math.ceil(totalMonths / 12);
  for (let y = 0; y < yearCount; y++) {
    const startCol = 2 + y * 12;
    const endCol = Math.min(2 + (y + 1) * 12 - 1, 1 + totalMonths);
    const color = YEAR_BAND_COLORS[y % YEAR_BAND_COLORS.length];
    const firstMonth = y * 12 + 1;
    const lastMonth = Math.min((y + 1) * 12, totalMonths);

    if (endCol > startCol) ws.mergeCells(3, startCol, 3, endCol);
    const yearCell = ws.getCell(3, startCol);
    yearCell.value = yearBandLabel(y, firstMonth, lastMonth, projectStartDate);
    yearCell.font = { bold: true, color: { argb: HEADER_FONT_COLOR } };
    yearCell.alignment = { horizontal: 'center' };
    for (let c = startCol; c <= endCol; c++) setFill(ws.getCell(3, c), color);
  }

  for (let m = 1; m <= totalMonths; m++) {
    const col = 1 + m;
    const year = Math.floor((m - 1) / 12);
    const color = YEAR_BAND_COLORS[year % YEAR_BAND_COLORS.length];
    const cell = ws.getCell(4, col);
    cell.value = monthLabel(m, projectStartDate);
    cell.font = { bold: true, color: { argb: HEADER_FONT_COLOR } };
    setFill(cell, color);
  }
}

/** A dedicated header row (row 5) showing each reporting period's span and duration, e.g. "REPORTING PERIOD 1 (M1-M12)". */
function writeReportingPeriodsRow(
  ws: Worksheet,
  totalMonths: number,
  reportingPeriods: GanttJson['reportingPeriods'],
): void {
  const row = 5;
  const labelCell = ws.getCell(row, 1);
  labelCell.value = 'Reporting Periods';
  labelCell.font = { bold: true };

  reportingPeriods.forEach((period, index) => {
    const from = Math.max(1, period.monthFrom);
    const to = Math.min(totalMonths, period.monthTo);
    if (to < from) return;
    const startCol = 1 + from;
    const endCol = 1 + to;

    if (endCol > startCol) ws.mergeCells(row, startCol, row, endCol);
    const cell = ws.getCell(row, startCol);
    cell.value = `REPORTING PERIOD ${index + 1} (M${period.monthFrom}-M${period.monthTo})`;
    cell.alignment = { horizontal: 'center' };
    cell.font = { bold: true, color: { argb: HEADER_FONT_COLOR } };
    for (let c = startCol; c <= endCol; c++) setFill(ws.getCell(row, c), HEADER_BAND_FILL);
  });
}

/** A visible vertical separator (medium black border) at the last month column of every reporting period but the last, across the whole grid — the explicit "διαχωριστικές γραμμές ανάμεσα στα Reporting Periods" request. */
function applyReportingPeriodSeparators(
  ws: Worksheet,
  totalMonths: number,
  reportingPeriods: GanttJson['reportingPeriods'],
  fromRow: number,
  toRow: number,
): void {
  const SEPARATOR_BORDER = { style: 'medium' as const, color: { argb: 'FF000000' } };
  const boundaryMonths = new Set(
    reportingPeriods.map((p) => Math.min(p.monthTo, totalMonths)).filter((m) => m > 0 && m < totalMonths),
  );
  for (const m of boundaryMonths) {
    const col = 1 + m;
    for (let r = fromRow; r <= toRow; r++) {
      const cell = ws.getCell(r, col);
      cell.border = { ...cell.border, right: SEPARATOR_BORDER };
    }
  }
}
