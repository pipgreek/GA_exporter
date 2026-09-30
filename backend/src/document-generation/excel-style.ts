// Colors/fonts reverse-engineered from a real VILABS-produced Gantt workbook
// (EVOLVE2CARE_Gantt Chart, provided as a visual reference 2026-09-30) so the
// generated .xlsx matches VILABS' existing house style rather than an
// invented palette. Two Excel-standard "colored cell" styles (Public/
// Sensitive) come straight from Excel's built-in conditional-format presets.
export const HEADER_FONT_COLOR = 'FF366088';
export const HEADER_BAND_FILL = 'FFA4EDF5';

// Cycled per 12-month year block on the Overview sheet; only the first two
// were observed in the reference (a 24-month/2-year GA) — years 3-4 extend
// the same cyan family for longer projects up to MAX_TOTAL_MONTHS (§7).
export const YEAR_BAND_COLORS = ['FFD0FDFF', 'FFA4EDF5', 'FF7DDCE8', 'FF56CBDB'];

export const WP_FILL = 'FFA5A5A5';
export const MILESTONE_FILL = 'FF595959';
export const MILESTONE_FONT_COLOR = 'FFFFFFFF';
export const TASK_ACTIVE_FILL = 'FFF2F2F2';

// Excel's built-in "Green Fill with Dark Green Text" / "Yellow Fill with
// Dark Yellow Text" cell styles, matching the workbook's own Public/
// Sensitive legend swatches.
export const DELIVERABLE_PUBLIC_FILL = 'FFC6EFCE';
export const DELIVERABLE_PUBLIC_FONT = 'FF006100';
export const DELIVERABLE_SENSITIVE_FILL = 'FFFFEB9C';
export const DELIVERABLE_SENSITIVE_FONT = 'FF9C5700';
// Fallback for dissemination levels beyond Public/Sensitive (EU-R/EU-C/EU-S/tbd).
export const DELIVERABLE_OTHER_FILL = 'FFD9D9D9';
export const DELIVERABLE_OTHER_FONT = 'FF000000';

export const GRID_BORDER_COLOR = 'FFE7E6E6';

export const LABEL_COLUMN_WIDTH = 14.5;
export const MONTH_COLUMN_WIDTH = 11;

export function deliverableStyle(disseminationLevel: string): { fill: string; font: string } {
  if (disseminationLevel === 'PU') return { fill: DELIVERABLE_PUBLIC_FILL, font: DELIVERABLE_PUBLIC_FONT };
  if (disseminationLevel === 'SEN') return { fill: DELIVERABLE_SENSITIVE_FILL, font: DELIVERABLE_SENSITIVE_FONT };
  return { fill: DELIVERABLE_OTHER_FILL, font: DELIVERABLE_OTHER_FONT };
}
