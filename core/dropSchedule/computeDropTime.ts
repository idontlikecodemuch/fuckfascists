/**
 * Deterministic, minute-level drop time computation for the weekly scorecard.
 *
 * Every install computes the same drop time for any given ISO week — no network
 * calls, no server dependency, and no per-device random state. The algorithm is
 * versioned through the "ff-drop-v2" seed prefix.
 *
 * Algorithm:
 *  1. Use a strongly mixed 32-bit hash to build one shared pseudorandom sequence.
 *  2. Select uniformly from every minute in the Friday 6pm–Saturday 4pm ET window.
 *  3. Advance through the sequence by a pseudorandom distance that guarantees
 *     adjacent weeks are separated by at least the configured minimum.
 *  4. Convert the Eastern wall-clock window to one UTC instant, accounting for
 *     US daylight-saving time. Every timezone therefore receives one global drop.
 */

import {
  SCORECARD_DROP_MIN_SEPARATION_MINUTES,
  SCORECARD_WINDOW_START_HOUR,
  SCORECARD_WINDOW_END_HOUR,
} from '../../config/constants';

const MINUTE_MS = 60_000;
const WEEK_MS = 7 * 86_400_000;
const WINDOW_MINUTES =
  (24 - SCORECARD_WINDOW_START_HOUR + SCORECARD_WINDOW_END_HOUR) * 60;
const DROP_SEED_PREFIX = 'ff-drop-v2';

// The sequence is anchored at ISO 2026-W1. Earlier and later weeks walk the
// same deterministic sequence backward or forward, so year boundaries do not
// need a special collision rule.
const SCHEDULE_EPOCH_YEAR = 2026;
const SCHEDULE_EPOCH_WEEK = 1;

// ── Hash ──────────────────────────────────────────────────────────────────────

/**
 * xmur3-style 32-bit hash finalizer. Math.imul and bitwise shifts have defined
 * 32-bit behavior in JavaScript, so this produces the same value on every app.
 * Unlike the old djb2 suffix hash, adjacent week indexes avalanche instead of
 * producing adjacent output values.
 */
function hash32(str: string): number {
  let hash = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(hash ^ str.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
  return (hash ^ (hash >>> 16)) >>> 0;
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

/**
 * Pseudorandom transition between adjacent weeks. Keeping the circular step
 * between MIN and WINDOW-MIN guarantees the ordinary (linear) distance between
 * the two selected minute slots is also at least MIN, including after wrapping.
 */
function stepForWeekIndex(index: number): number {
  const allowedStepCount = WINDOW_MINUTES - 2 * SCORECARD_DROP_MIN_SEPARATION_MINUTES + 1;
  return SCORECARD_DROP_MIN_SEPARATION_MINUTES +
    (hash32(`${DROP_SEED_PREFIX}-step-${index}`) % allowedStepCount);
}

// ── ISO week arithmetic ───────────────────────────────────────────────────────

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

function nthSundayOfMonth(year: number, month: number, occurrence: number): number {
  const firstDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const firstSunday = 1 + ((7 - firstDayOfWeek) % 7);
  return firstSunday + (occurrence - 1) * 7;
}

/**
 * UTC offset magnitude for America/New_York on a Friday/Saturday drop date.
 * US DST begins on the second Sunday in March and ends on the first Sunday in
 * November. The drop window never crosses Sunday, so date precision is enough.
 */
function easternUtcOffsetHours(year: number, month: number, day: number): 4 | 5 {
  if (month < 2 || month > 10) return 5;
  if (month > 2 && month < 10) return 4;

  if (month === 2) {
    return day >= nthSundayOfMonth(year, 2, 2) ? 4 : 5;
  }

  return day < nthSundayOfMonth(year, 10, 1) ? 4 : 5;
}

/** Returns the shared minute slot for an ISO week. */
function minuteOffsetForWeek(isoWeekYear: number, isoWeekNumber: number): number {
  const epochMondayMs = mondayOfISOWeek(SCHEDULE_EPOCH_YEAR, SCHEDULE_EPOCH_WEEK).getTime();
  const targetMondayMs = mondayOfISOWeek(isoWeekYear, isoWeekNumber).getTime();
  const targetIndex = Math.round((targetMondayMs - epochMondayMs) / WEEK_MS);
  let minuteOffset = hash32(`${DROP_SEED_PREFIX}-epoch`) % WINDOW_MINUTES;

  if (targetIndex > 0) {
    for (let index = 1; index <= targetIndex; index++) {
      minuteOffset = (minuteOffset + stepForWeekIndex(index)) % WINDOW_MINUTES;
    }
  } else {
    for (let index = 0; index > targetIndex; index--) {
      minuteOffset = positiveModulo(minuteOffset - stepForWeekIndex(index), WINDOW_MINUTES);
    }
  }

  return minuteOffset;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Computes the deterministic drop time for a given ISO week.
 * Pure function — same inputs always produce the same output on every device.
 *
 * @param isoWeekYear   ISO week-numbering year (may differ from calendar year
 *                      in early January / late December).
 * @param isoWeekNumber ISO week number (1–52 or 1–53).
 * @returns UTC Date for the shared drop moment, within the Friday 6:00pm
 *          (inclusive) – Saturday 4:00pm (exclusive) America/New_York window.
 */
export function computeDropTime(isoWeekYear: number, isoWeekNumber: number): Date {
  // Friday of the ISO week = Monday + 4 days.
  const mondayMs = mondayOfISOWeek(isoWeekYear, isoWeekNumber).getTime();
  const friday = new Date(mondayMs + 4 * 86_400_000);
  const year = friday.getUTCFullYear();
  const month = friday.getUTCMonth();
  const day = friday.getUTCDate();
  const easternOffsetHours = easternUtcOffsetHours(year, month, day);
  const windowStartUtcMs = Date.UTC(
    year,
    month,
    day,
    SCORECARD_WINDOW_START_HOUR + easternOffsetHours,
  );

  return new Date(windowStartUtcMs + minuteOffsetForWeek(isoWeekYear, isoWeekNumber) * MINUTE_MS);
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
