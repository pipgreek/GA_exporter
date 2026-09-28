import { Worksheet } from 'exceljs';
import { PreviewSheet } from './preview.types';

const HEADER_FILL_ARGB = 'FF1F4E78';
const HEADER_FONT_ARGB = 'FFFFFFFF';
const SECTION_LABEL_FONT_ARGB = 'FF1F4E78';

export function writeSheet(worksheet: Worksheet, sheet: PreviewSheet): void {
  worksheet.addRow(sheet.headers);
  for (const row of sheet.rows) {
    worksheet.addRow(row);
  }
}

/** Styles header row 1 (fill + white bold text) and freezes it. */
export function styleHeaderRow(worksheet: Worksheet): void {
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL_ARGB } };
    cell.font = { bold: true, color: { argb: HEADER_FONT_ARGB } };
  });
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
}

/** Bolds rows whose first cell is a KPI group section label (col B/C blank). */
export function styleKpiSectionLabelRows(worksheet: Worksheet): void {
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const isSectionLabel = row.getCell(2).value === '' && row.getCell(3).value === '';
    if (isSectionLabel) {
      row.font = { bold: true, color: { argb: SECTION_LABEL_FONT_ARGB } };
    }
  });
}

export function autoSizeColumns(worksheet: Worksheet, minWidth = 8, maxWidth = 40): void {
  worksheet.columns.forEach((column) => {
    let maxLen = minWidth;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = cell.value == null ? 0 : String(cell.value).length;
      if (len > maxLen) maxLen = len;
    });
    column.width = Math.min(maxLen + 2, maxWidth);
  });
}

const INVALID_SHEET_NAME_CHARS = /[\\/*?:[\]]/g;
const MAX_SHEET_NAME_LENGTH = 31;

export function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(INVALID_SHEET_NAME_CHARS, ' ').trim();
  const truncated = cleaned.length > MAX_SHEET_NAME_LENGTH ? cleaned.slice(0, MAX_SHEET_NAME_LENGTH) : cleaned;
  return truncated || 'Sheet';
}

/** Ensures uniqueness (case-insensitive, as Excel requires) after truncation may have collided two names. */
export function uniqueSheetName(base: string, used: Set<string>): string {
  let name = base;
  let counter = 2;
  while (used.has(name.toLowerCase())) {
    const suffix = ` (${counter})`;
    name = base.slice(0, MAX_SHEET_NAME_LENGTH - suffix.length) + suffix;
    counter++;
  }
  used.add(name.toLowerCase());
  return name;
}
