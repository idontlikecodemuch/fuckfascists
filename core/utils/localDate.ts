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

/** Returns the current local date as YYYY-MM-DD. */
export function getLocalDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the Monday of the current local week as YYYY-MM-DD.
 * ISO week semantics: week starts on Monday.
 */
export function getLocalWeekStart(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Sunday (0) → go back 6 days; Mon (1) → 0; Tue (2) → -1; etc.
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffToMonday);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const mday = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${mday}`;
}
