/**
 * Deterministic drop time computation for the weekly report card.
 *
 * Every install computes the same drop time for any given ISO week — no network
 * calls, no server dependency, no random state. The algorithm is versioned
 * implicitly through the hash key prefix ("ff-drop-"). If the algorithm ever
 * needs to change, bump the prefix.
 *
 * Algorithm:
 *  1. Hash the ISO week key ("ff-drop-{year}-W{week}") with djb2.
 *  2. Map hash mod WINDOW_HOURS to an hour offset within the drop window
 *     (Friday 4pm ET – Saturday 3pm ET, hardcoded as UTC-5/EST for MVP).
 *  3. Avoid the previous week's hour: if collision, advance by 1 (mod WINDOW_HOURS).
 *  4. Return a UTC Date for Friday of the ISO week at (windowStart + offset) UTC.
 *
 * TODO (V2): Handle EDT (UTC-4). During DST the displayed drop time shifts 1 hour
 * (e.g. user sees "4pm" instead of "5pm ET") but all installs see the same absolute
 * moment. This is acceptable for MVP.
 */

import {
  REPORT_CARD_WINDOW_START_HOUR,
  REPORT_CARD_WINDOW_END_HOUR,
} from '../../config/constants';

// EST = UTC-5 hardcoded for MVP. See TODO above for EDT handling.
const ET_OFFSET_HOURS = 5;

// Window size in hours: Friday 4pm ET through Saturday 3pm ET = 23 hours.
// 24 - 16 (hours remaining on Friday) + 15 (hours on Saturday up to 3pm) = 23.
const WINDOW_HOURS =
  24 - REPORT_CARD_WINDOW_START_HOUR + REPORT_CARD_WINDOW_END_HOUR;

// UTC hour at which the drop window opens (Friday 4pm ET = Friday 21:00 UTC at EST).
const WINDOW_START_UTC_HOUR = REPORT_CARD_WINDOW_START_HOUR + ET_OFFSET_HOURS;

// ── Hash ──────────────────────────────────────────────────────────────────────

/**
 * djb2 string hash — deterministic, pure, no dependencies.
 * Returns a non-negative 32-bit integer.
 */
function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // (hash << 5) + hash = hash * 33; | 0 keeps the value in 32-bit range.
    hash = (((hash << 5) + hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function weekKey(year: number, week: number): string {
  return `ff-drop-${year}-W${week}`;
}

function rawHourOffset(year: number, week: number): number {
  return djb2(weekKey(year, week)) % WINDOW_HOURS;
}

// ── ISO week arithmetic ───────────────────────────────────────────────────────

/**
 * Number of ISO weeks in a calendar year (52 or 53).
 * A year has 53 ISO weeks if it starts on Thursday, or is a leap year that
 * starts on Wednesday.
 */
function isoWeeksInYear(year: number): number {
  const jan1Day = new Date(Date.UTC(year, 0, 1)).getUTCDay();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  if (jan1Day === 4) return 53;
  if (jan1Day === 3 && isLeap) return 53;
  return 52;
}

/** Returns the (year, week) pair immediately preceding the given pair. */
function prevISOWeek(year: number, week: number): { year: number; week: number } {
  if (week > 1) return { year, week: week - 1 };
  return { year: year - 1, week: isoWeeksInYear(year - 1) };
}

/**
 * Returns the UTC Date of the Monday that starts ISO week {week} of {year}.
 * ISO week 1 is the week containing the first Thursday of the year.
 */
function mondayOfISOWeek(year: number, week: number): Date {
  // Jan 4 is always in ISO week 1.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  // Sunday (0) is treated as day 7 for ISO purposes.
  const daysToMonday1 = jan4Day === 0 ? -6 : 1 - jan4Day;
  const monday1Ms = jan4.getTime() + daysToMonday1 * 86_400_000;
  return new Date(monday1Ms + (week - 1) * 7 * 86_400_000);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Computes the deterministic drop time for a given ISO week.
 * Pure function — same inputs always produce the same output on every device.
 *
 * @param isoWeekYear   ISO week-numbering year (may differ from calendar year
 *                      in early January / late December).
 * @param isoWeekNumber ISO week number (1–52 or 1–53).
 * @returns UTC Date for the drop moment (Friday or Saturday of that ISO week,
 *          within the Friday 4pm ET – Saturday 3pm ET window).
 */
export function computeDropTime(isoWeekYear: number, isoWeekNumber: number): Date {
  let hourOffset = rawHourOffset(isoWeekYear, isoWeekNumber);

  // Avoid last week's hour — advance by 1 (wrapping within the window).
  const prev = prevISOWeek(isoWeekYear, isoWeekNumber);
  if (hourOffset === rawHourOffset(prev.year, prev.week)) {
    hourOffset = (hourOffset + 1) % WINDOW_HOURS;
  }

  // Friday of the ISO week = Monday + 4 days.
  const mondayMs = mondayOfISOWeek(isoWeekYear, isoWeekNumber).getTime();
  const fridayMs = mondayMs + 4 * 86_400_000;

  // Drop time = Friday at (WINDOW_START_UTC_HOUR + hourOffset) hours UTC.
  return new Date(fridayMs + (WINDOW_START_UTC_HOUR + hourOffset) * 3_600_000);
}

/**
 * Returns the ISO week year and week number for a given UTC timestamp.
 * ISO weeks are identified by their Thursday: Thursday's calendar year and
 * ordinal week position determine the ISO week year and number.
 */
export function getISOWeek(nowMs: number): { year: number; week: number } {
  const dayOfWeek = new Date(nowMs).getUTCDay(); // 0=Sun ... 6=Sat
  // Thursday of the same ISO week (Sun treated as 7):
  const thursdayMs = nowMs + (4 - (dayOfWeek === 0 ? 7 : dayOfWeek)) * 86_400_000;
  const thursday = new Date(thursdayMs);
  const year = thursday.getUTCFullYear();

  const yearStartMs = new Date(Date.UTC(year, 0, 1)).getTime();
  const dayOfYear = Math.floor((thursdayMs - yearStartMs) / 86_400_000);
  const week = Math.ceil((dayOfYear + 1) / 7);

  return { year, week };
}

/**
 * Computes the drop time for the current ISO week.
 * This is the only function in this module that reads the clock.
 */
export function getCurrentDropTime(): Date {
  const { year, week } = getISOWeek(Date.now());
  return computeDropTime(year, week);
}
