import { getLocalWeekStartForDate } from '../../../core/utils/localDate';

const DROP_SCORED_WEEK_ANCHOR_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the Sat-Fri scored week represented by a Friday/Saturday drop.
 *
 * The live week key rolls forward at local Saturday midnight, but the drop can
 * remain open after that. Anchoring one day before dropAt keeps late opens tied
 * to the week that ended Friday instead of the live week that just started.
 */
export function getScoredWeekOfDrop(dropAt: number): string {
  return getLocalWeekStartForDate(new Date(dropAt - DROP_SCORED_WEEK_ANCHOR_MS));
}
