import {
  EARLY_WEEK_NUDGE_DAYS,
  EARLY_WEEK_NUDGE_END_HOUR,
  EARLY_WEEK_NUDGE_START_HOUR,
  SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR,
  SCORECARD_QUIET_NOTIFICATION_FROM_HOUR,
} from '../../../config/constants';
import { addLocalDays, getLocalWeekStartForDate } from '../../../core/utils/localDate';
import {
  getEarlyWeekNudgeCopyIndex,
  getEarlyWeekNudgeForWeek,
  getNextEarlyWeekNudge,
  getUpcomingEarlyWeekNudges,
  hasEarlyWeekNudgeMinutes,
  resolveEarlyWeekNudgeWindow,
} from '../utils/earlyWeekNudge';

const COPY_COUNT = 8;
// Eight messages with no timing of their own: any minute of the base window.
const MESSAGES = Array.from({ length: COPY_COUNT }, () => ({}));
// Saturday, October 10, 2026 (local) — start of a scored week.
const WEEK_OF = '2026-10-10';

function weeksFrom(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addLocalDays(start, i * 7));
}

describe('getEarlyWeekNudgeForWeek', () => {
  it('is deterministic for a given week', () => {
    const a = getEarlyWeekNudgeForWeek(WEEK_OF, MESSAGES);
    const b = getEarlyWeekNudgeForWeek(WEEK_OF, MESSAGES);
    expect(a).not.toBeNull();
    expect(a?.at.getTime()).toBe(b?.at.getTime());
    expect(a?.copyIndex).toBe(b?.copyIndex);
  });

  it('lands on a window day, inside window hours, in the same scored week', () => {
    for (const weekOf of weeksFrom('2026-01-03', 156)) {
      const slot = getEarlyWeekNudgeForWeek(weekOf, MESSAGES);
      expect(slot).not.toBeNull();
      if (!slot) continue;
      expect(EARLY_WEEK_NUDGE_DAYS).toContain(slot.at.getDay());
      expect(slot.at.getHours()).toBeGreaterThanOrEqual(EARLY_WEEK_NUDGE_START_HOUR);
      expect(slot.at.getHours()).toBeLessThan(EARLY_WEEK_NUDGE_END_HOUR);
      expect(slot.at.getSeconds()).toBe(0);
      expect(getLocalWeekStartForDate(slot.at)).toBe(weekOf);
      expect(slot.weekOf).toBe(weekOf);
    }
  });

  it('spreads across the window instead of repeating one time', () => {
    const minutes = new Set(
      weeksFrom('2026-01-03', 52).map((weekOf) => {
        const at = getEarlyWeekNudgeForWeek(weekOf, MESSAGES)?.at;
        return at ? `${at.getDay()}-${at.getHours()}:${at.getMinutes()}` : 'none';
      }),
    );
    expect(minutes.size).toBeGreaterThan(40);
    expect(minutes.has('none')).toBe(false);
  });

  it('never picks a minute inside quiet hours, even with an overlapping window', () => {
    const morning = { days: [1], startHour: 6, endHour: 12 };
    const night = { days: [2], startHour: 20, endHour: 26 };
    for (const weekOf of weeksFrom('2026-01-03', 60)) {
      const early = getEarlyWeekNudgeForWeek(weekOf, MESSAGES, morning);
      const late = getEarlyWeekNudgeForWeek(weekOf, MESSAGES, night);
      expect(early?.at.getHours()).toBeGreaterThanOrEqual(SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR);
      expect(early?.at.getHours()).toBeLessThan(12);
      expect(late?.at.getHours()).toBeGreaterThanOrEqual(20);
      expect(late?.at.getHours()).toBeLessThan(SCORECARD_QUIET_NOTIFICATION_FROM_HOUR);
    }
  });

  it('returns null when the whole window sits inside quiet hours', () => {
    const window = { days: [1], startHour: 0, endHour: SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR };
    expect(getEarlyWeekNudgeForWeek(WEEK_OF, MESSAGES, window)).toBeNull();
  });
  it('keeps each message inside its own days and hours', () => {
    const messages = [{ days: [1] }, { days: [2], endHour: 14 }, { startHour: 11, endHour: 14 }, {}];
    for (const weekOf of weeksFrom('2026-01-03', 104)) {
      const slot = getEarlyWeekNudgeForWeek(weekOf, messages);
      if (!slot) throw new Error('slot missing');
      const window = resolveEarlyWeekNudgeWindow(messages[slot.copyIndex]);
      expect(window.days).toContain(slot.at.getDay());
      expect(slot.at.getHours()).toBeGreaterThanOrEqual(window.startHour);
      expect(slot.at.getHours()).toBeLessThan(window.endHour);
      expect(getLocalWeekStartForDate(slot.at)).toBe(weekOf);
    }
  });

  it('picks the message from the week alone, whatever the timings', () => {
    const timed = [{ days: [1] }, { days: [2] }, { startHour: 11, endHour: 14 }, {}];
    for (const weekOf of weeksFrom('2026-01-03', 52)) {
      expect(getEarlyWeekNudgeForWeek(weekOf, timed)?.copyIndex)
        .toBe(getEarlyWeekNudgeCopyIndex(weekOf, timed.length));
    }
  });

  it('returns null for no messages or a message with no usable minutes', () => {
    expect(getEarlyWeekNudgeForWeek(WEEK_OF, [])).toBeNull();
    expect(hasEarlyWeekNudgeMinutes({ startHour: 0, endHour: SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR })).toBe(false);
    expect(hasEarlyWeekNudgeMinutes({})).toBe(true);
  });
});

describe('getEarlyWeekNudgeCopyIndex', () => {
  it('never repeats a message two weeks running, before or after the epoch', () => {
    const weeks = weeksFrom('2025-01-04', 260);
    const indexes = weeks.map((weekOf) => getEarlyWeekNudgeCopyIndex(weekOf, COPY_COUNT));
    for (let i = 1; i < indexes.length; i++) {
      expect(indexes[i]).not.toBe(indexes[i - 1]);
    }
  });

  it('uses every message and stays in range', () => {
    const indexes = weeksFrom('2026-01-03', 104)
      .map((weekOf) => getEarlyWeekNudgeCopyIndex(weekOf, COPY_COUNT));
    expect(new Set(indexes).size).toBe(COPY_COUNT);
    for (const index of indexes) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(COPY_COUNT);
    }
  });

  it('returns 0 when there is only one message', () => {
    expect(getEarlyWeekNudgeCopyIndex(WEEK_OF, 1)).toBe(0);
  });
});

describe('getNextEarlyWeekNudge', () => {
  const thisWeek = getEarlyWeekNudgeForWeek(WEEK_OF, MESSAGES);
  const nextWeek = getEarlyWeekNudgeForWeek(addLocalDays(WEEK_OF, 7), MESSAGES);
  if (!thisWeek || !nextWeek) throw new Error('fixture slots missing');
  const MINUTE_MS = 60_000;

  it('returns this week from the weekend before the window', () => {
    const saturdayNoon = new Date(2026, 9, 10, 12, 0).getTime();
    expect(getNextEarlyWeekNudge(saturdayNoon, MESSAGES)).toEqual(thisWeek);
  });

  it('returns this week right up to the slot', () => {
    const justBefore = thisWeek.at.getTime() - MINUTE_MS;
    expect(getNextEarlyWeekNudge(justBefore, MESSAGES)).toEqual(thisWeek);
  });

  it('moves to next week once this week has fired', () => {
    expect(getNextEarlyWeekNudge(thisWeek.at.getTime(), MESSAGES)).toEqual(nextWeek);
    const fridayNight = new Date(2026, 9, 16, 22, 0).getTime();
    expect(getNextEarlyWeekNudge(fridayNight, MESSAGES)).toEqual(nextWeek);
  });

  it('skips a week the user has already started', () => {
    const saturdayNoon = new Date(2026, 9, 10, 12, 0).getTime();
    expect(getNextEarlyWeekNudge(saturdayNoon, MESSAGES, WEEK_OF)).toEqual(nextWeek);
  });

  it('returns null when the window has no usable minutes', () => {
    const window = { days: [1], startHour: 0, endHour: 0 };
    expect(getNextEarlyWeekNudge(Date.now(), MESSAGES, null, window)).toBeNull();
  });
});

describe('getUpcomingEarlyWeekNudges', () => {
  const saturdayNoon = new Date(2026, 9, 10, 12, 0).getTime();

  it('returns one slot per consecutive week, soonest first', () => {
    const slots = getUpcomingEarlyWeekNudges(saturdayNoon, MESSAGES, 3);
    expect(slots.map((slot) => slot.weekOf)).toEqual(weeksFrom(WEEK_OF, 3));
    for (const slot of slots) expect(slot.at.getTime()).toBeGreaterThan(saturdayNoon);
  });

  it('skips the skipped week and still fills the queue', () => {
    const slots = getUpcomingEarlyWeekNudges(saturdayNoon, MESSAGES, 3, WEEK_OF);
    // 2026-10-31 is Election Day week: no nudge (the election reminders run instead).
    expect(slots.map((slot) => slot.weekOf)).toEqual(['2026-10-17', '2026-10-24', '2026-11-07']);
  });

  it('returns nothing for a window with no usable minutes', () => {
    const window = { days: [1], startHour: 0, endHour: 0 };
    expect(getUpcomingEarlyWeekNudges(saturdayNoon, MESSAGES, 3, null, window)).toEqual([]);
  });
});
