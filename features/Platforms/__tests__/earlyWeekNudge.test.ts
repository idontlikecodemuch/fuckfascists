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
} from '../utils/earlyWeekNudge';

const COPY_COUNT = 8;
// Saturday, October 10, 2026 (local) — start of a scored week.
const WEEK_OF = '2026-10-10';

function weeksFrom(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addLocalDays(start, i * 7));
}

describe('getEarlyWeekNudgeForWeek', () => {
  it('is deterministic for a given week', () => {
    const a = getEarlyWeekNudgeForWeek(WEEK_OF, COPY_COUNT);
    const b = getEarlyWeekNudgeForWeek(WEEK_OF, COPY_COUNT);
    expect(a).not.toBeNull();
    expect(a?.at.getTime()).toBe(b?.at.getTime());
    expect(a?.copyIndex).toBe(b?.copyIndex);
  });

  it('lands on a window day, inside window hours, in the same scored week', () => {
    for (const weekOf of weeksFrom('2026-01-03', 156)) {
      const slot = getEarlyWeekNudgeForWeek(weekOf, COPY_COUNT);
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
        const at = getEarlyWeekNudgeForWeek(weekOf, COPY_COUNT)?.at;
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
      const early = getEarlyWeekNudgeForWeek(weekOf, COPY_COUNT, morning);
      const late = getEarlyWeekNudgeForWeek(weekOf, COPY_COUNT, night);
      expect(early?.at.getHours()).toBeGreaterThanOrEqual(SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR);
      expect(early?.at.getHours()).toBeLessThan(12);
      expect(late?.at.getHours()).toBeGreaterThanOrEqual(20);
      expect(late?.at.getHours()).toBeLessThan(SCORECARD_QUIET_NOTIFICATION_FROM_HOUR);
    }
  });

  it('returns null when the whole window sits inside quiet hours', () => {
    const window = { days: [1], startHour: 0, endHour: SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR };
    expect(getEarlyWeekNudgeForWeek(WEEK_OF, COPY_COUNT, window)).toBeNull();
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
  const thisWeek = getEarlyWeekNudgeForWeek(WEEK_OF, COPY_COUNT);
  const nextWeek = getEarlyWeekNudgeForWeek(addLocalDays(WEEK_OF, 7), COPY_COUNT);
  if (!thisWeek || !nextWeek) throw new Error('fixture slots missing');
  const MINUTE_MS = 60_000;

  it('returns this week from the weekend before the window', () => {
    const saturdayNoon = new Date(2026, 9, 10, 12, 0).getTime();
    expect(getNextEarlyWeekNudge(saturdayNoon, COPY_COUNT)).toEqual(thisWeek);
  });

  it('returns this week right up to the slot', () => {
    const justBefore = thisWeek.at.getTime() - MINUTE_MS;
    expect(getNextEarlyWeekNudge(justBefore, COPY_COUNT)).toEqual(thisWeek);
  });

  it('moves to next week once this week has fired', () => {
    expect(getNextEarlyWeekNudge(thisWeek.at.getTime(), COPY_COUNT)).toEqual(nextWeek);
    const fridayNight = new Date(2026, 9, 16, 22, 0).getTime();
    expect(getNextEarlyWeekNudge(fridayNight, COPY_COUNT)).toEqual(nextWeek);
  });

  it('skips a week the user has already started', () => {
    const saturdayNoon = new Date(2026, 9, 10, 12, 0).getTime();
    expect(getNextEarlyWeekNudge(saturdayNoon, COPY_COUNT, WEEK_OF)).toEqual(nextWeek);
  });

  it('returns null when the window has no usable minutes', () => {
    const window = { days: [1], startHour: 0, endHour: 0 };
    expect(getNextEarlyWeekNudge(Date.now(), COPY_COUNT, null, window)).toBeNull();
  });
});
