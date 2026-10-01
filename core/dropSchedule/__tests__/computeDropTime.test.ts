import { computeDropTime, getISOWeek, getCurrentDropTime } from '../computeDropTime';
import { SCORECARD_DROP_MIN_SEPARATION_MINUTES } from '../../../config/constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

const easternFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hourCycle: 'h23',
});

function getEasternParts(drop: Date): { weekday: string; hour: number; minute: number } {
  const parts = easternFormatter.formatToParts(drop);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';

  return {
    weekday: value('weekday'),
    hour: Number(value('hour')),
    minute: Number(value('minute')),
  };
}

/** Minute offset inside Friday 6pm–Saturday 4pm ET. */
function getWindowMinuteOffset(drop: Date): number {
  const { weekday, hour, minute } = getEasternParts(drop);
  if (weekday === 'Fri') return (hour - 18) * 60 + minute;
  if (weekday === 'Sat') return 6 * 60 + hour * 60 + minute;
  throw new Error(`drop fell outside Friday/Saturday ET: ${drop.toISOString()}`);
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
      process.env.TZ = originalTimezone;
    }
  });

  it('keeps versioned winter and daylight-time fixtures stable', () => {
    expect(computeDropTime(2026, 1).toISOString()).toBe('2026-01-03T09:47:00.000Z');
    expect(computeDropTime(2026, 32).toISOString()).toBe('2026-08-07T22:20:00.000Z');
  });

  it('keeps every drop inside Friday 6pm–Saturday 4pm America/New_York', () => {
    for (const { year, week } of weekPairs(2020, 2040)) {
      const { weekday, hour } = getEasternParts(computeDropTime(year, week));
      expect(['Fri', 'Sat']).toContain(weekday);
      if (weekday === 'Fri') expect(hour).toBeGreaterThanOrEqual(18);
      if (weekday === 'Sat') expect(hour).toBeLessThan(16);
    }
  });

  it('uses minute-level times across the full window instead of on-the-hour slots', () => {
    const offsets = weekPairs(2020, 2040).map(({ year, week }) =>
      getWindowMinuteOffset(computeDropTime(year, week)),
    );
    const nonHourlyDrops = offsets.filter((offset) => offset % 60 !== 0).length;
    const quartileCounts = [0, 0, 0, 0];
    for (const offset of offsets) {
      quartileCounts[Math.min(Math.floor(offset / 330), 3)]++;
    }

    expect(nonHourlyDrops / offsets.length).toBeGreaterThan(0.9);
    expect(new Set(offsets).size).toBeGreaterThan(650);
    for (const count of quartileCounts) expect(count).toBeGreaterThan(200);
  });

  it('separates every pair of adjacent drops across years', () => {
    let previousOffset: number | null = null;
    for (const { year, week } of weekPairs(2020, 2040)) {
      const offset = getWindowMinuteOffset(computeDropTime(year, week));
      if (previousOffset !== null) {
        expect(Math.abs(offset - previousOffset))
          .toBeGreaterThanOrEqual(SCORECARD_DROP_MIN_SEPARATION_MINUTES);
      }
      previousOffset = offset;
    }
  });

  it('does not reproduce the 2026 late-window one-hour countdown', () => {
    const offsets = Array.from({ length: 9 }, (_, index) =>
      getWindowMinuteOffset(computeDropTime(2026, 32 + index)),
    );
    const oneHourEarlierSteps = offsets.slice(1).filter(
      (offset, index) => offset === offsets[index] - 60,
    );

    expect(oneHourEarlierSteps).toHaveLength(0);
    expect(new Set(offsets).size).toBe(offsets.length);
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

    expect(['Fri', 'Sat']).toContain(getEasternParts(drop).weekday);
    expect(Math.abs(drop.getTime() - nowMs)).toBeLessThan(8 * 86_400_000);
  });
});
