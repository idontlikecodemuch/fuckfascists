import { SCORECARD_PRESENTATION_WINDOW_MS } from '../../../config/constants';
import { computeDropTime, getISOWeek } from '../../../core/dropSchedule/computeDropTime';

function isoWeeksInYear(year: number): number {
  const jan1Day = new Date(Date.UTC(year, 0, 1)).getUTCDay();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  if (jan1Day === 4) return 53;
  if (jan1Day === 3 && isLeap) return 53;
  return 52;
}

function previousISOWeek(year: number, week: number): { year: number; week: number } {
  if (week > 1) return { year, week: week - 1 };
  return { year: year - 1, week: isoWeeksInYear(year - 1) };
}

/**
 * Returns the drop that should drive scorecard display for `nowMs`.
 *
 * Usually this is the current ISO week's drop. The exception is early in a new
 * ISO week, when the previous week's drop may still be inside the presentation
 * window. Without that exception a Monday open after a late Saturday drop can
 * skip the still-active card.
 */
export function getScorecardDropTimeForTimestamp(nowMs: number): Date {
  const currentWeek = getISOWeek(nowMs);
  const currentDrop = computeDropTime(currentWeek.year, currentWeek.week);
  if (nowMs >= currentDrop.getTime()) return currentDrop;

  const previousWeek = previousISOWeek(currentWeek.year, currentWeek.week);
  const previousDrop = computeDropTime(previousWeek.year, previousWeek.week);
  if (nowMs - previousDrop.getTime() < SCORECARD_PRESENTATION_WINDOW_MS) {
    return previousDrop;
  }

  return currentDrop;
}
