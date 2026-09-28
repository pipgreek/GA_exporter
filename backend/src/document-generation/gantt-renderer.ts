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
  const { totalMonths, workPackages, milestones, deliverables } = gantt;
  const ws = workbook.addWorksheet(sanitizeSheetName(`M1-M${totalMonths} Overview`));

  ws.getColumn(1).width = LABEL_COLUMN_WIDTH;
  for (let m = 1; m <= totalMonths; m++) ws.getColumn(1 + m).width = MONTH_COLUMN_WIDTH;

  writeLegendRows(ws);
  writeYearAndMonthHeaders(ws, totalMonths);

  const milestonesById = new Map(milestones.map((m) => [m.id, m]));
  const deliverablesByWp = new Map<string, GanttJson['deliverables']>();
  for (const d of deliverables) {
    const list = deliverablesByWp.get(d.wp) ?? [];
    list.push(d);
    deliverablesByWp.set(d.wp, list);
  }

  let rowIndex = 5;
  for (const wp of workPackages) {
    const wpRow = ws.getRow(rowIndex);
    const wpLabelCell = wpRow.getCell(1);
    wpLabelCell.value = wp.id;
    wpLabelCell.font = { bold: true };

    const dueMonthToMilestoneId = new Map<number, string>();
    for (const id of wp.milestoneIds ?? []) {
      const milestone = milestonesById.get(id);
      if (milestone) dueMonthToMilestoneId.set(milestone.dueMonth, milestone.id);
    }

    for (let m = 1; m <= totalMonths; m++) {
      const cell = wpRow.getCell(1 + m);
      const milestoneId = dueMonthToMilestoneId.get(m);
      if (milestoneId) {
        cell.value = milestoneId;
        setFill(cell, MILESTONE_FILL);
        cell.font = { bold: true, color: { argb: MILESTONE_FONT_COLOR } };
      } else if (m >= wp.monthFrom && m <= wp.monthTo) {
        setFill(cell, WP_FILL);
      }
    }
    rowIndex += 1;

    const taskRowStart = rowIndex;
    for (const task of wp.tasks) {
      const taskRow = ws.getRow(rowIndex);
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

    // Deliverables only carry a wp reference in the schema, not a task id.
    // Distributed round-robin across the WP's own task rows (matches the
    // numbering pattern observed in the reference workbook, e.g. D1.1/D1.4
    // -> T1.1, D1.2/D1.5 -> T1.2); falls back to the WP row itself if the WP
    // has no tasks.
    const wpDeliverables = deliverablesByWp.get(wp.id) ?? [];
    for (let i = 0; i < wpDeliverables.length; i++) {
      const d = wpDeliverables[i];
      if (d.dueMonth < 1 || d.dueMonth > totalMonths) continue;
      const targetRow =
        wp.tasks.length > 0 ? ws.getRow(taskRowStart + (i % wp.tasks.length)) : wpRow;
      const cell = targetRow.getCell(1 + d.dueMonth);
      const style = deliverableStyle(d.disseminationLevel);
      cell.value = d.id;
      setFill(cell, style.fill);
      cell.font = { bold: true, color: { argb: style.font } };
    }
  }

  applyGridBorders(ws, 4, 1 + totalMonths, rowIndex - 1);
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

function writeYearAndMonthHeaders(ws: Worksheet, totalMonths: number): void {
  const yearCount = Math.ceil(totalMonths / 12);
  for (let y = 0; y < yearCount; y++) {
    const startCol = 2 + y * 12;
    const endCol = Math.min(2 + (y + 1) * 12 - 1, 1 + totalMonths);
    const color = YEAR_BAND_COLORS[y % YEAR_BAND_COLORS.length];

    if (endCol > startCol) ws.mergeCells(3, startCol, 3, endCol);
    const yearCell = ws.getCell(3, startCol);
    yearCell.value = `YEAR ${y + 1}`;
    yearCell.font = { bold: true, color: { argb: HEADER_FONT_COLOR } };
    yearCell.alignment = { horizontal: 'center' };
    for (let c = startCol; c <= endCol; c++) setFill(ws.getCell(3, c), color);
  }

  for (let m = 1; m <= totalMonths; m++) {
    const col = 1 + m;
    const year = Math.floor((m - 1) / 12);
    const color = YEAR_BAND_COLORS[year % YEAR_BAND_COLORS.length];
    const cell = ws.getCell(4, col);
    cell.value = `M${m}`;
    cell.font = { bold: true, color: { argb: HEADER_FONT_COLOR } };
    setFill(cell, color);
  }
}
