export function monthLabels(totalMonths: number): string[] {
  return Array.from({ length: totalMonths }, (_, i) => `M${i + 1}`);
}
