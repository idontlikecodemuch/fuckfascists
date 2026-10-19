import { computeDropTime, getISOWeek, getCurrentDropTime } from '../computeDropTime';
import {
  SCORECARD_DROP_MIN_SEPARATION_MINUTES,
  SCORECARD_DROP_SEGMENTS,
} from '../../../config/constants';
import { isQuietNotificationHour } from '../../utils/quietHours';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatters = new Map<string, Intl.DateTimeFormat>();

function getZoneParts(
  drop: Date,
  timeZone = 'America/New_York',
): { weekday: string; hour: number; minute: number } {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(drop);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    weekday: value('weekday'),
    hour: Number(value('hour')),
    minute: Number(value('minute')),
  };
}

const WEEKDAY_INDEX: Record<string, number> = { Fri: 5, Sat: 6 };

/** Slot index across both segments (0 … total-1), from the ET wall clock. */
function getSlot(drop: Date): number {
  const { weekday, hour, minute } = getZoneParts(drop);
  let offset = 0;
  for (const segment of SCORECARD_DROP_SEGMENTS) {
    if (WEEKDAY_INDEX[weekday] === segment.day && hour >= segment.startHour && hour < segment.endHour) {
      return offset + (hour - segment.startHour) * 60 + minute;
    }
    offset += (segment.endHour - segment.startHour) * 60;
  }
  throw new Error(`drop fell outside the ET segments: ${drop.toISOString()}`);
}

/** ET wall-clock minutes since Friday 00:00 — the "real" time-of-week position. */
function getWallClockMinuteOfWeek(drop: Date): number {
  const { weekday, hour, minute } = getZoneParts(drop);
  return (WEEKDAY_INDEX[weekday] - 5) * 1440 + hour * 60 + minute;
}

function isoWeeksInYear(year: number): number {
  const jan1Day = new Date(Date.UTC(year, 0, 1)).getUTCDay();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  return jan1Day === 4 || (jan1Day === 3 && isLeap) ? 53 : 52;
}

function weekPairs(startYear: number, endYear: number): Array<{ year: number; week: number }> {
  const result: Array<{ year: number; week: number }> = [];
  for (let year = startYear; year <= endYear; year++) {
    for (let week = 1; week <= isoWeeksInYear(year); week++) {
      result.push({ year, week });
    }
  }
  return result;
}

const TOTAL_SLOTS = SCORECARD_DROP_SEGMENTS.reduce(
  (sum, segment) => sum + (segment.endHour - segment.startHour) * 60,
  0,
);

// ── computeDropTime ───────────────────────────────────────────────────────────

describe('computeDropTime', () => {
  it('returns the same absolute moment for the same week in every device timezone', () => {
    const originalTimezone = process.env.TZ;
    try {
      process.env.TZ = 'Pacific/Honolulu';
      const hawaii = computeDropTime(2026, 34).getTime();
      process.env.TZ = 'Asia/Tokyo';
      const tokyo = computeDropTime(2026, 34).getTime();
      process.env.TZ = 'Europe/London';
      const london = computeDropTime(2026, 34).getTime();

      expect(hawaii).toBe(tokyo);
      expect(tokyo).toBe(london);
    } finally {
      if (originalTimezone === undefined) delete process.env.TZ;
      else process.env.TZ = originalTimezone;
    }
  });

  it('keeps versioned winter, daylight-time and Saturday fixtures stable', () => {
    // Fri Jan 2 2026 10:49pm EST, Fri Aug 7 2026 10:09pm EDT, Sat Mar 14 2026 1:36pm EDT.
    expect(computeDropTime(2026, 1).toISOString()).toBe('2026-01-03T03:49:00.000Z');
    expect(computeDropTime(2026, 32).toISOString()).toBe('2026-08-08T02:09:00.000Z');
    expect(computeDropTime(2026, 11).toISOString()).toBe('2026-03-14T17:36:00.000Z');
  });

  it('keeps every drop inside Fri 4:00–10:59pm or Sat 12:00–5:59pm America/New_York', () => {
    for (const { year, week } of weekPairs(2020, 2040)) {
      const drop = computeDropTime(year, week);
      const { weekday, hour } = getZoneParts(drop);
      if (weekday === 'Fri') {
        expect(hour).toBeGreaterThanOrEqual(16);
        expect(hour).toBeLessThanOrEqual(22);
      } else {
        expect(weekday).toBe('Sat');
        expect(hour).toBeGreaterThanOrEqual(12);
        expect(hour).toBeLessThanOrEqual(17);
      }
    }
  });

  it.each([
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Phoenix',
    'America/Los_Angeles',
  ])('never lands in local quiet hours in %s (every week 2026–2040)', (timeZone) => {
    for (const { year, week } of weekPairs(2026, 2040)) {
      const drop = computeDropTime(year, week);
      const { hour } = getZoneParts(drop, timeZone);
      if (isQuietNotificationHour(hour)) {
        throw new Error(`${year}-W${week} drops at local hour ${hour} in ${timeZone}`);
      }
    }
  });

  it('uses minute-level times spread across both segments', () => {
    const slots = weekPairs(2020, 2040).map(({ year, week }) =>
      getSlot(computeDropTime(year, week)),
    );
    const nonHourlyDrops = slots.filter((slot) => slot % 60 !== 0).length;
    const quarter = TOTAL_SLOTS / 4;
    const quartileCounts = [0, 0, 0, 0];
    for (const slot of slots) {
      quartileCounts[Math.min(Math.floor(slot / quarter), 3)]++;
    }
    const fridayShare = slots.filter((slot) => slot < 420).length / slots.length;

    expect(nonHourlyDrops / slots.length).toBeGreaterThan(0.9);
    expect(new Set(slots).size).toBeGreaterThan(500);
    for (const count of quartileCounts) expect(count).toBeGreaterThan(200);
    // 420 of 780 slots are on Friday.
    expect(fridayShare).toBeGreaterThan(0.48);
    expect(fridayShare).toBeLessThan(0.6);
  });

  it('separates every pair of adjacent drops by the minimum wall-clock minutes, across years', () => {
    let previous: number | null = null;
    for (const { year, week } of weekPairs(2020, 2040)) {
      const minuteOfWeek = getWallClockMinuteOfWeek(computeDropTime(year, week));
      if (previous !== null) {
        expect(Math.abs(minuteOfWeek - previous))
          .toBeGreaterThanOrEqual(SCORECARD_DROP_MIN_SEPARATION_MINUTES);
      }
      previous = minuteOfWeek;
    }
  });

  it('does not repeat a slot or step back exactly one hour across consecutive weeks', () => {
    const slots = Array.from({ length: 9 }, (_, index) =>
      getSlot(computeDropTime(2026, 32 + index)),
    );
    const oneHourEarlierSteps = slots.slice(1).filter(
      (slot, index) => slot === slots[index] - 60,
    );

    expect(oneHourEarlierSteps).toHaveLength(0);
    expect(new Set(slots).size).toBe(slots.length);
  });

  it('handles week 1 and 52/53-week year boundaries', () => {
    for (const [year, week] of [[2020, 53], [2021, 1], [2024, 52], [2025, 1]] as const) {
      const drop = computeDropTime(year, week);
      expect(drop).toBeInstanceOf(Date);
      expect(Number.isNaN(drop.getTime())).toBe(false);
    }
  });
});

// ── getISOWeek ────────────────────────────────────────────────────────────────

describe('getISOWeek', () => {
  it('returns correct ISO week for a known Monday (2024-03-11 = W11)', () => {
    const monday = new Date('2024-03-11T00:00:00Z').getTime();
    expect(getISOWeek(monday)).toEqual({ year: 2024, week: 11 });
  });

  it('returns correct ISO week for a mid-week date in the same week', () => {
    const wednesday = new Date('2024-03-13T12:00:00Z').getTime();
    expect(getISOWeek(wednesday)).toEqual({ year: 2024, week: 11 });
  });

  it('handles Jan 1 2024 (ISO week 1 of 2024)', () => {
    const jan1 = new Date('2024-01-01T00:00:00Z').getTime();
    expect(getISOWeek(jan1)).toEqual({ year: 2024, week: 1 });
  });

  it('handles Dec 31 2018 (ISO week 1 of 2019 — year rollover)', () => {
    const dec31 = new Date('2018-12-31T00:00:00Z').getTime();
    expect(getISOWeek(dec31)).toEqual({ year: 2019, week: 1 });
  });

  it('handles Dec 28 2020 (ISO week 53 of 2020 — 53-week year)', () => {
    const dec28 = new Date('2020-12-28T00:00:00Z').getTime();
    expect(getISOWeek(dec28)).toEqual({ year: 2020, week: 53 });
  });
});

// ── getCurrentDropTime ────────────────────────────────────────────────────────

describe('getCurrentDropTime', () => {
  it('returns a valid Date', () => {
    const drop = getCurrentDropTime();
    expect(drop).toBeInstanceOf(Date);
    expect(Number.isNaN(drop.getTime())).toBe(false);
  });

  it('returns a current-week drop within eight days of now', () => {
    const nowMs = Date.now();
    const drop = getCurrentDropTime();

    expect(['Fri', 'Sat']).toContain(getZoneParts(drop).weekday);
    expect(Math.abs(drop.getTime() - nowMs)).toBeLessThan(8 * 86_400_000);
  });
});
