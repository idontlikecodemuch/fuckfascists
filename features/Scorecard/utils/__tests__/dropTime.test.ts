import { SCORECARD_PRESENTATION_WINDOW_MS } from '../../../../config/constants';
import { computeDropTime } from '../../../../core/dropSchedule/computeDropTime';
import {
  getNextScorecardDropAfter,
  getScorecardDropRefreshDelayMs,
  getScorecardDropTimeForTimestamp,
} from '../dropTime';

const HOUR_MS = 60 * 60 * 1000;

describe('getScorecardDropTimeForTimestamp', () => {
  it('moves on to next week once the window closes before the Monday UTC rollover', () => {
    // 2026-W42 drops Fri Oct 16; its window ends Sun Oct 18, before
    // Mon Oct 19 00:00 UTC (Sun 8pm EDT).
    const w42 = computeDropTime(2026, 42).getTime();
    const sundayEvening = Date.parse('2026-10-18T19:45:00-04:00');
    expect(w42 + SCORECARD_PRESENTATION_WINDOW_MS).toBeLessThanOrEqual(sundayEvening);
    expect(sundayEvening).toBeLessThan(Date.parse('2026-10-19T00:00:00Z'));

    const dropAt = getScorecardDropTimeForTimestamp(sundayEvening).getTime();

    expect(dropAt).toBe(computeDropTime(2026, 43).getTime());
    expect(getScorecardDropRefreshDelayMs(sundayEvening, dropAt)).toBe(dropAt - sundayEvening + 1000);
  });

  it('keeps last week\'s drop through its window after the ISO week rolls over', () => {
    const w42 = computeDropTime(2026, 42).getTime();
    const insideWindow = w42 + SCORECARD_PRESENTATION_WINDOW_MS - HOUR_MS;
    const mondayAfterSaturdayDrop = computeDropTime(2026, 11).getTime() + 36 * HOUR_MS;

    expect(getScorecardDropTimeForTimestamp(insideWindow).getTime()).toBe(w42);
    expect(getScorecardDropTimeForTimestamp(mondayAfterSaturdayDrop).getTime())
      .toBe(computeDropTime(2026, 11).getTime());
  });

  it('always has a next refresh boundary around every drop and window end, 2026–2030', () => {
    const samples: number[] = [];
    for (let year = 2026; year <= 2030; year++) {
      for (let week = 1; week <= 52; week++) {
        const drop = computeDropTime(year, week).getTime();
        const windowEnd = drop + SCORECARD_PRESENTATION_WINDOW_MS;
        samples.push(drop - 60_000, drop, windowEnd - 60_000, windowEnd, windowEnd + HOUR_MS);
      }
    }
    for (const nowMs of samples) {
      const dropAt = getScorecardDropTimeForTimestamp(nowMs).getTime();
      if (dropAt <= nowMs) {
        expect(nowMs - dropAt).toBeLessThan(SCORECARD_PRESENTATION_WINDOW_MS);
      } else {
        expect(dropAt - nowMs).toBeLessThanOrEqual(8 * 24 * HOUR_MS);
      }
      const delay = getScorecardDropRefreshDelayMs(nowMs, dropAt);
      if (delay === null || delay <= 0) {
        throw new Error(`no refresh boundary at ${new Date(nowMs).toISOString()}`);
      }
    }
  });
});

describe('getNextScorecardDropAfter', () => {
  it('is next week\'s drop inside this week\'s 48h window', () => {
    const w43 = computeDropTime(2026, 43).getTime(); // Sat Oct 24 2026, 4:51pm EDT
    const sundayMorning = Date.parse('2026-10-25T10:00:00-04:00');
    expect(getScorecardDropTimeForTimestamp(sundayMorning).getTime()).toBe(w43);
    expect(getNextScorecardDropAfter(sundayMorning).getTime()).toBe(computeDropTime(2026, 44).getTime());
    expect(getNextScorecardDropAfter(w43).getTime()).toBe(computeDropTime(2026, 44).getTime());
  });

  it('is this week\'s drop before it lands', () => {
    const w43 = computeDropTime(2026, 43).getTime();
    expect(getNextScorecardDropAfter(w43 - 1).getTime()).toBe(w43);
  });

  it('is always the first drop strictly after now, 2026–2030', () => {
    for (let year = 2026; year <= 2030; year += 1) {
      for (let week = 1; week <= 52; week += 1) {
        const dropAt = computeDropTime(year, week).getTime();
        const next = getNextScorecardDropAfter(dropAt).getTime();
        expect(next).toBeGreaterThan(dropAt);
        expect(getNextScorecardDropAfter(next - 1).getTime()).toBe(next);
        expect(next - dropAt).toBeLessThan(9 * 24 * HOUR_MS);
      }
    }
  });
});

describe('getScorecardDropRefreshDelayMs', () => {
  it('refreshes shortly after a future drop boundary', () => {
    const nowMs = Date.UTC(2026, 4, 29, 22, 59);
    const dropAtMs = Date.UTC(2026, 4, 29, 23, 0);

    expect(getScorecardDropRefreshDelayMs(nowMs, dropAtMs)).toBe(61_000);
  });

  it('refreshes shortly after the presentation window expires', () => {
    const dropAtMs = Date.UTC(2026, 4, 29, 23, 0);
    const nowMs = dropAtMs + SCORECARD_PRESENTATION_WINDOW_MS - 60_000;

    expect(getScorecardDropRefreshDelayMs(nowMs, dropAtMs)).toBe(61_000);
  });

  it('does not schedule another refresh for an already-expired drop', () => {
    const dropAtMs = Date.UTC(2026, 4, 29, 23, 0);
    const nowMs = dropAtMs + SCORECARD_PRESENTATION_WINDOW_MS;

    expect(getScorecardDropRefreshDelayMs(nowMs, dropAtMs)).toBeNull();
  });
});
