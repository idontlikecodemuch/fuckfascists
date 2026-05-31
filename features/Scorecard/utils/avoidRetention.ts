import {
  getBetaDropTimeForTimestamp,
  isBetaScheduleActive,
} from '../../../core/dropSchedule/betaDropSchedule';
import { getLocalWeekStartForDate } from '../../../core/utils/localDate';
import { getScorecardDropTimeForTimestamp } from './dropTime';
import { getScoredWeekOfDrop } from './scoredWeek';

/**
 * Startup cleanup must not delete the just-finished scored week before the
 * scorecard capture flow has a chance to save it. On Saturdays/Sundays the
 * live local week has already rolled forward, but the active drop still belongs
 * to the prior Sat-Fri window.
 */
export function getScorecardAvoidPurgeCutoff(now: Date = new Date()): string {
  const currentWeekStart = getLocalWeekStartForDate(now);
  const nowMs = now.getTime();
  const dropAt = isBetaScheduleActive()
    ? getBetaDropTimeForTimestamp(nowMs).getTime()
    : getScorecardDropTimeForTimestamp(nowMs).getTime();
  const scoredWeekOfDrop = getScoredWeekOfDrop(dropAt);

  return scoredWeekOfDrop < currentWeekStart ? scoredWeekOfDrop : currentWeekStart;
}
