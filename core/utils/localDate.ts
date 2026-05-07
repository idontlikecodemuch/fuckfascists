/**
 * Local-time date utilities for event storage.
 *
 * Event dates (EntityAvoidEvent.date, PlatformAvoidEvent.weekOf) are stored
 * using the device's local calendar day, not UTC. A user who avoids a business
 * at 9pm Pacific on Tuesday gets a Tuesday record — not a Wednesday (UTC) record.
 *
 * Use these helpers everywhere a new event date is computed. Do not use
 * toISOString() for user-facing date keys.
 */

/** Formats a Date as YYYY-MM-DD in the device's local calendar. */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns the current local date as YYYY-MM-DD. */
export function getLocalDateString(): string {
  return formatLocalDate(new Date());
}

/**
 * Returns the Saturday that starts the local week containing `date`.
 * Week runs Saturday-Friday to align with the Friday scorecard drop window.
 */
export function getLocalWeekStartForDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const dayOfMonth = d.getDate();
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Saturday (6) -> 0; Sunday (0) -> -1; Mon (1) -> -2; ... Fri (5) -> -6
  const diffToSaturday = day === 6 ? 0 : -(day + 1);
  return formatLocalDate(new Date(year, month, dayOfMonth + diffToSaturday));
}

/**
 * Returns the Saturday that starts the current local week as YYYY-MM-DD.
 * Week runs Saturday–Friday to align with the Friday scorecard drop window.
 */
export function getLocalWeekStart(): string {
  return getLocalWeekStartForDate(new Date());
}
