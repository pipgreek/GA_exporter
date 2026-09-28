import { Workbook } from 'exceljs';
import { KpiJson } from '../llm/schemas/kpi.schema';
import {
  autoSizeColumns,
  sanitizeSheetName,
  styleHeaderRow,
  styleKpiSectionLabelRows,
  uniqueSheetName,
  writeSheet,
} from './excel-render-utils';
import { mapKpiToPreviewSheets } from './kpi-mapping';
import { PreviewSheet } from './preview.types';
import { assertKpiWithinRenderLimits } from './render-limits';

export interface RenderedKpiExcel {
  buffer: Buffer;
  sheets: PreviewSheet[];
}

export async function renderKpiExcel(kpi: KpiJson): Promise<RenderedKpiExcel> {
  assertKpiWithinRenderLimits(kpi);
  const sheets = mapKpiToPreviewSheets(kpi);

  const workbook = new Workbook();
  workbook.creator = 'GA Exporter';
  workbook.created = new Date();

  const usedNames = new Set<string>();
  for (const sheet of sheets) {
    const name = uniqueSheetName(sanitizeSheetName(sheet.name), usedNames);
    const worksheet = workbook.addWorksheet(name);
    writeSheet(worksheet, sheet);
    styleHeaderRow(worksheet);
    styleKpiSectionLabelRows(worksheet);
    autoSizeColumns(worksheet);
  }

  const buffer = (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  return { buffer, sheets };
}
