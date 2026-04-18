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

/**
 * Formats a weekOf date for the scorecard PNG filename.
 * e.g. "2026-04-11" → "April-11-26"
 *
 * Hyphen-separated, full month name title-cased, 2-digit year. Reads as
 * an inscription date when combined with the filename prefix:
 * "Those-I-FCKd-April-11-26.png".
 */
export function formatFilenameDate(weekOf: string): string {
  const d = new Date(`${weekOf}T00:00:00Z`);
  const opts: Intl.DateTimeFormatOptions = {
    month: 'long', day: '2-digit', year: '2-digit', timeZone: 'UTC',
  };
  // en-US "April 11, 26" → split, rejoin with hyphens
  const [monthDay, year] = d.toLocaleString('en-US', opts).split(', ');
  const [month, day] = monthDay.split(' ');
  return `${month}-${day}-${year}`;
}

/**
 * Formats a weekOf date for human reading in the archive view.
 * e.g. "2026-04-11" → "April 11, 2026"
 */
export function formatReadableDate(weekOf: string): string {
  const d = new Date(`${weekOf}T00:00:00Z`);
  const opts: Intl.DateTimeFormatOptions = {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  };
  return d.toLocaleString('en-US', opts);
}

/**
 * Builds the scorecard PNG filename (without path).
 * e.g. "2026-04-11" → "Those-I-FCKd-April-11-26.png"
 *
 * The prefix echoes the card's hero sentence ("I FCKd [grid] N× this week")
 * and reads like an inscription when the receiver sees it on share.
 */
export function buildCardFilename(weekOf: string): string {
  return `Those-I-FCKd-${formatFilenameDate(weekOf)}.png`;
}
