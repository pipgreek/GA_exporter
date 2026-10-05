const MONTH_ABBREVIATIONS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

function monthDate(projectStartDate: string, projectMonthIndex: number): Date {
  const start = new Date(`${projectStartDate}T00:00:00Z`);
  return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + (projectMonthIndex - 1), 1));
}

/** "M3", or "M3 - DEC" (the calendar month this project month actually falls in) once projectStartDate is known. */
export function monthLabel(projectMonthIndex: number, projectStartDate?: string): string {
  if (!projectStartDate) return `M${projectMonthIndex}`;
  const date = monthDate(projectStartDate, projectMonthIndex);
  return `M${projectMonthIndex} - ${MONTH_ABBREVIATIONS[date.getUTCMonth()]}`;
}

export function monthLabels(totalMonths: number, projectStartDate?: string): string[] {
  return Array.from({ length: totalMonths }, (_, i) => monthLabel(i + 1, projectStartDate));
}

/** "YEAR 2", or "YEAR 2 - 2025/2026" (calendar years the block's first/last project month fall in) once projectStartDate is known. */
export function yearBandLabel(
  yearIndex: number,
  firstMonth: number,
  lastMonth: number,
  projectStartDate?: string,
): string {
  const label = `YEAR ${yearIndex + 1}`;
  if (!projectStartDate) return label;
  const startYear = monthDate(projectStartDate, firstMonth).getUTCFullYear();
  const endYear = monthDate(projectStartDate, lastMonth).getUTCFullYear();
  return startYear === endYear ? `${label} - ${startYear}` : `${label} - ${startYear}/${endYear}`;
}
