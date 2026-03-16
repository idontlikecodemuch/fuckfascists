/**
 * Formats a YYYY-MM-DD week-of date for display.
 * e.g. "2024-03-11" → "Mar 11"
 */
export function formatWeekOf(weekOf: string): string {
  const date = new Date(`${weekOf}T00:00:00Z`);
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = date.getUTCDate();
  return `${month} ${day}`;
}
