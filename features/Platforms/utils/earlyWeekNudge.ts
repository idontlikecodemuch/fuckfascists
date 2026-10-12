/**
 * Deterministic schedule for the early-week nudge notification.
 *
 * One nudge per scored (Sat–Fri) week, at a pseudorandom minute inside the
 * EARLY_WEEK_NUDGE_* window in device-local time. The minute and the message
 * are derived only from the week's start date, so:
 *  - every device gets the same local wall-clock time for a given week;
 *  - rescheduling on every app launch never moves an already-scheduled nudge;
 *  - nothing is stored and nothing leaves the device.
 *
 * Minutes inside notification quiet hours are never selected, even if the
 * window constants are edited to overlap them.
 */

import { hash32 } from '../../../core/dropSchedule/computeDropTime';
import { addLocalDays, getLocalWeekStartForDate } from '../../../core/utils/localDate';
import { isQuietNotificationHour } from '../../../core/utils/quietHours';
import {
  EARLY_WEEK_NUDGE_DAYS,
  EARLY_WEEK_NUDGE_END_HOUR,
  EARLY_WEEK_NUDGE_START_HOUR,
  WEEK_START_DAY,
} from '../../../config/constants';

// Bump the version suffix to reshuffle every future week's time and message.
const SEED_PREFIX = 'ff-early-nudge-v1';
// A Saturday (scored-week start). Anchors the no-repeat message walk.
const COPY_EPOCH_WEEK_OF = '2026-01-03';
const MINUTES_PER_HOUR = 60;
const DAYS_PER_WEEK = 7;
const DAY_MS = 86_400_000;
// Current week, then the next one or two (skipped week, or this week's slot
// already passed).
const WEEKS_TO_SEARCH = 3;

export interface EarlyWeekNudgeWindow {
  /** Days of week, 0 = Sunday. */
  days: readonly number[];
  /** Local hour, inclusive. */
  startHour: number;
  /** Local hour, exclusive. */
  endHour: number;
}

export const DEFAULT_EARLY_WEEK_NUDGE_WINDOW: EarlyWeekNudgeWindow = {
  days: EARLY_WEEK_NUDGE_DAYS,
  startHour: EARLY_WEEK_NUDGE_START_HOUR,
  endHour: EARLY_WEEK_NUDGE_END_HOUR,
};

export interface EarlyWeekNudgeSlot {
  /** Saturday that starts the scored week the nudge belongs to (YYYY-MM-DD). */
  weekOf: string;
  /** Absolute fire time, built from local calendar components. */
  at: Date;
  /** Index into the early-week nudge copy list. */
  copyIndex: number;
}

interface HourSlot {
  /** Days after the week's Saturday start. */
  dayOffset: number;
  hour: number;
}

/** Every (day, hour) in the window that is outside quiet hours, in time order. */
function buildHourSlots(window: EarlyWeekNudgeWindow): HourSlot[] {
  const offsets = Array.from(
    new Set(window.days.map((day) => (day - WEEK_START_DAY + DAYS_PER_WEEK) % DAYS_PER_WEEK)),
  ).sort((a, b) => a - b);
  const startHour = Math.max(0, window.startHour);
  const endHour = Math.min(24, window.endHour);
  const slots: HourSlot[] = [];

  for (const dayOffset of offsets) {
    for (let hour = startHour; hour < endHour; hour++) {
      if (!isQuietNotificationHour(hour)) slots.push({ dayOffset, hour });
    }
  }
  return slots;
}

function weeksBetween(fromWeekOf: string, toWeekOf: string): number {
  const toUtcMs = (date: string) => {
    const [year, month, day] = date.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtcMs(toWeekOf) - toUtcMs(fromWeekOf)) / (DAYS_PER_WEEK * DAY_MS));
}

function positiveModulo(value: number, modulus: number): number {
  return ((value % modulus) + modulus) % modulus;
}

/** Step of 1..count-1, so adjacent weeks never repeat a message. */
function copyStep(index: number, count: number): number {
  return 1 + (hash32(`${SEED_PREFIX}-copy-step-${index}`) % (count - 1));
}

/**
 * Message index for a week. Walks one shared sequence from the epoch week,
 * so two consecutive weeks never get the same message.
 */
export function getEarlyWeekNudgeCopyIndex(weekOf: string, count: number): number {
  if (count <= 1) return 0;
  const target = weeksBetween(COPY_EPOCH_WEEK_OF, weekOf);
  let index = hash32(`${SEED_PREFIX}-copy-epoch`) % count;

  if (target > 0) {
    for (let week = 1; week <= target; week++) {
      index = (index + copyStep(week, count)) % count;
    }
  } else {
    for (let week = 0; week > target; week--) {
      index = positiveModulo(index - copyStep(week, count), count);
    }
  }
  return index;
}

/**
 * The nudge slot for one scored week, or null when the window has no
 * usable minutes (for example, it sits entirely inside quiet hours).
 */
export function getEarlyWeekNudgeForWeek(
  weekOf: string,
  copyCount: number,
  window: EarlyWeekNudgeWindow = DEFAULT_EARLY_WEEK_NUDGE_WINDOW,
): EarlyWeekNudgeSlot | null {
  const hourSlots = buildHourSlots(window);
  if (hourSlots.length === 0) return null;

  const minuteIndex = hash32(`${SEED_PREFIX}-time-${weekOf}`) %
    (hourSlots.length * MINUTES_PER_HOUR);
  const { dayOffset, hour } = hourSlots[Math.floor(minuteIndex / MINUTES_PER_HOUR)];
  const [year, month, day] = weekOf.split('-').map(Number);

  return {
    weekOf,
    at: new Date(year, month - 1, day + dayOffset, hour, minuteIndex % MINUTES_PER_HOUR),
    copyIndex: getEarlyWeekNudgeCopyIndex(weekOf, copyCount),
  };
}

/**
 * The next nudge that is still in the future, skipping `skipWeekOf` (a week
 * where the user already logged an avoid). Returns null if none is found.
 */
export function getNextEarlyWeekNudge(
  nowMs: number,
  copyCount: number,
  skipWeekOf: string | null = null,
  window: EarlyWeekNudgeWindow = DEFAULT_EARLY_WEEK_NUDGE_WINDOW,
): EarlyWeekNudgeSlot | null {
  let weekOf = getLocalWeekStartForDate(new Date(nowMs));

  for (let i = 0; i < WEEKS_TO_SEARCH; i++) {
    if (weekOf !== skipWeekOf) {
      const slot = getEarlyWeekNudgeForWeek(weekOf, copyCount, window);
      if (!slot) return null;
      if (slot.at.getTime() > nowMs) return slot;
    }
    weekOf = addLocalDays(weekOf, DAYS_PER_WEEK);
  }
  return null;
}
