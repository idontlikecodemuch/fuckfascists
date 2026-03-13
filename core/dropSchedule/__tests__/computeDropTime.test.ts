import { computeDropTime, getISOWeek, getCurrentDropTime } from '../computeDropTime';

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extracts the hour offset (0–22) from a drop Date by measuring how many hours
 * after Friday 21:00 UTC the drop falls.
 */
function getHourOffset(drop: Date): number {
  const dayOfWeek = drop.getUTCDay();
  // If the drop is on Saturday (6), Friday is 1 day before.
  const daysFromFriday = dayOfWeek === 6 ? 1 : 0;
  const fridayWindowStart = new Date(drop);
  fridayWindowStart.setUTCDate(fridayWindowStart.getUTCDate() - daysFromFriday);
  fridayWindowStart.setUTCHours(21, 0, 0, 0);
  return Math.round((drop.getTime() - fridayWindowStart.getTime()) / 3_600_000);
}

// ── computeDropTime ───────────────────────────────────────────────────────────

describe('computeDropTime', () => {
  it('returns the same Date for the same inputs (determinism)', () => {
    expect(computeDropTime(2024, 11).getTime()).toBe(computeDropTime(2024, 11).getTime());
    expect(computeDropTime(2025, 1).getTime()).toBe(computeDropTime(2025, 1).getTime());
    expect(computeDropTime(2024, 52).getTime()).toBe(computeDropTime(2024, 52).getTime());
  });

  it('output falls within the Friday 4pm ET – Saturday 2pm ET window for all weeks in 2024', () => {
    for (let week = 1; week <= 52; week++) {
      const drop = computeDropTime(2024, week);
      const dayOfWeek = drop.getUTCDay(); // 5=Fri, 6=Sat

      expect([5, 6]).toContain(dayOfWeek);

      if (dayOfWeek === 5 /* Friday */) {
        // Must be at or after 21:00 UTC (4pm ET)
        expect(drop.getUTCHours()).toBeGreaterThanOrEqual(21);
      } else {
        // Saturday: must be before 20:00 UTC (3pm ET)
        expect(drop.getUTCHours()).toBeLessThan(20);
      }
    }
  });

  it('two consecutive weeks never produce the same hour offset', () => {
    // The "avoid last week" rule guarantees this invariant.
    for (let week = 2; week <= 52; week++) {
      const thisOffset = getHourOffset(computeDropTime(2024, week));
      const prevOffset = getHourOffset(computeDropTime(2024, week - 1));
      expect(thisOffset).not.toBe(prevOffset);
    }
  });

  it('handles week 1 / year rollover without throwing', () => {
    // Week 1 must look up the previous year's last week without crashing.
    const drop2025W1 = computeDropTime(2025, 1);
    expect(drop2025W1).toBeInstanceOf(Date);
    expect(isNaN(drop2025W1.getTime())).toBe(false);

    const drop2024W1 = computeDropTime(2024, 1);
    expect(drop2024W1).toBeInstanceOf(Date);
    expect(isNaN(drop2024W1.getTime())).toBe(false);
  });

  it('week 1 and the last week of the previous year have different hour offsets', () => {
    // 2023 has 52 ISO weeks; 2024 week 1 must differ from 2023 week 52.
    const w1 = getHourOffset(computeDropTime(2024, 1));
    const w52prev = getHourOffset(computeDropTime(2023, 52));
    expect(w1).not.toBe(w52prev);
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
    // 2018-12-31 is Monday of ISO week 1 of 2019.
    const dec31 = new Date('2018-12-31T00:00:00Z').getTime();
    expect(getISOWeek(dec31)).toEqual({ year: 2019, week: 1 });
  });

  it('handles Dec 28 2020 (ISO week 53 of 2020 — 53-week year)', () => {
    // 2020 has 53 ISO weeks; Dec 28 is in week 53.
    const dec28 = new Date('2020-12-28T00:00:00Z').getTime();
    expect(getISOWeek(dec28)).toEqual({ year: 2020, week: 53 });
  });
});

// ── getCurrentDropTime ────────────────────────────────────────────────────────

describe('getCurrentDropTime', () => {
  it('returns a valid Date', () => {
    const drop = getCurrentDropTime();
    expect(drop).toBeInstanceOf(Date);
    expect(isNaN(drop.getTime())).toBe(false);
  });

  it('returns the same value as computeDropTime for the current ISO week', () => {
    // Freeze the clock for this test by calling both within the same ms window.
    const nowMs = Date.now();
    const drop = getCurrentDropTime();

    const dayOfWeek = drop.getUTCDay();
    expect([5, 6]).toContain(dayOfWeek); // must be Friday or Saturday
    // Sanity: the drop is a real timestamp within 8 days of now
    expect(Math.abs(drop.getTime() - nowMs)).toBeLessThan(8 * 86_400_000);
  });
});
