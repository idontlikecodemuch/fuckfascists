/**
 * Formats an avoidance count for display on the scorecard.
 * e.g. 1 → "1×", 12 → "12×"
 */
export function formatCount(n: number): string {
  return `${n}\u00d7`; // ×
}

/**
 * Formats a weekOf date into a human-readable range.
 * e.g. "2024-03-09" → "MAR 9 — MAR 15"
 * Uses uppercase for the rendered card and preview header.
 */
export function formatWeekRange(weekOf: string): string {
  const start = new Date(`${weekOf}T00:00:00Z`);
  const end   = new Date(`${weekOf}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);

  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  const startStr = start.toLocaleString('en-US', opts).toUpperCase();
  const endStr   = end.toLocaleString('en-US', opts).toUpperCase();

  return `${startStr} \u2014 ${endStr}`; // em dash
}
