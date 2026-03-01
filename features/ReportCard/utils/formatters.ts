/**
 * Formats an avoidance count for display on the report card.
 * e.g. 1 → "1×", 12 → "12×"
 */
export function formatCount(n: number): string {
  return `${n}\u00d7`; // ×
}

/**
 * Formats a weekOf date into a human-readable range.
 * e.g. "2024-03-11" → "Mar 11 – Mar 17, 2024"
 */
export function formatWeekRange(weekOf: string): string {
  const start = new Date(`${weekOf}T00:00:00Z`);
  const end   = new Date(`${weekOf}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6); // Sunday

  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', timeZone: 'UTC' };
  const startStr = start.toLocaleString('en-US', opts);
  const endStr   = end.toLocaleString('en-US', { ...opts, year: 'numeric' });

  return `${startStr} \u2013 ${endStr}`; // en dash
}

/**
 * Formats a Unix timestamp (ms) as a local day + time string.
 * e.g. 1710277200000 → "Friday, Mar 15 at 4:00 PM"
 */
export function formatDropTime(dropAt: number): string {
  const date = new Date(dropAt);
  const day  = date.toLocaleString('en-US', { weekday: 'long' });
  const mon  = date.toLocaleString('en-US', { month: 'short', day: 'numeric' });
  const time = date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${day}, ${mon} at ${time}`;
}
