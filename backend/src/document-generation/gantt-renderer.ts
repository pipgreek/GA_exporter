import { Workbook } from 'exceljs';
import { GanttJson } from '../llm/schemas/gantt.schema';
import { autoSizeColumns, sanitizeSheetName, styleHeaderRow, uniqueSheetName, writeSheet } from './excel-render-utils';
import { mapGanttToPreviewSheets } from './gantt-mapping';
import { PreviewSheet } from './preview.types';
import { assertGanttWithinRenderLimits } from './render-limits';

export interface RenderedGanttExcel {
  buffer: Buffer;
  sheets: PreviewSheet[];
}

export async function renderGanttExcel(gantt: GanttJson): Promise<RenderedGanttExcel> {
  assertGanttWithinRenderLimits(gantt);
  const sheets = mapGanttToPreviewSheets(gantt);

  const workbook = new Workbook();
  workbook.creator = 'GA Exporter';
  workbook.created = new Date();

  const usedNames = new Set<string>();
  for (const sheet of sheets) {
    const name = uniqueSheetName(sanitizeSheetName(sheet.name), usedNames);
    const worksheet = workbook.addWorksheet(name);
    writeSheet(worksheet, sheet);
    styleHeaderRow(worksheet);
    autoSizeColumns(worksheet);
  }

  const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  return { buffer, sheets };
}
