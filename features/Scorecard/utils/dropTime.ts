import { SCORECARD_PRESENTATION_WINDOW_MS } from '../../../config/constants';
import { computeDropTime, getISOWeek } from '../../../core/dropSchedule/computeDropTime';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function dropForISOWeekContaining(ms: number): number {
  const { year, week } = getISOWeek(ms);
  return computeDropTime(year, week).getTime();
}

/**
 * Returns the drop that should drive scorecard display for `nowMs`: the latest
 * drop at or before now while it is inside its presentation window, otherwise
 * the next drop after now.
 *
 * This does not depend on which ISO week `nowMs` falls in. Drops come once per
 * ISO week, so the previous, current and next weeks' drops always contain both
 * candidates. (Keying on the current ISO week left a stale, already-expired
 * drop in place when the window closed before the Monday 00:00 UTC rollover,
 * e.g. Sunday evening ET, and the refresh timer then found no next boundary.)
 */
export function getScorecardDropTimeForTimestamp(nowMs: number): Date {
  const drops = [nowMs - WEEK_MS, nowMs, nowMs + WEEK_MS].map(dropForISOWeekContaining);
  const latestPassed = Math.max(...drops.filter((dropAt) => dropAt <= nowMs));
  if (Number.isFinite(latestPassed) && nowMs - latestPassed < SCORECARD_PRESENTATION_WINDOW_MS) {
    return new Date(latestPassed);
  }
  return new Date(Math.min(...drops.filter((dropAt) => dropAt > nowMs)));
}

/**
 * Delay until the display drop next changes: the drop moment itself, or the
 * end of its presentation window. Always non-null for a drop returned by
 * getScorecardDropTimeForTimestamp; null only for an already-expired drop.
 */
export function getScorecardDropRefreshDelayMs(nowMs: number, dropAtMs: number): number | null {
  const nextBoundaryMs = nowMs < dropAtMs
    ? dropAtMs
    : dropAtMs + SCORECARD_PRESENTATION_WINDOW_MS;

  if (nowMs >= nextBoundaryMs) return null;

  // Re-check just after the boundary so Date.now()-based comparisons settle.
  return nextBoundaryMs - nowMs + 1000;
}
