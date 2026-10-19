import { computeDropTime, getISOWeek } from '../../../core/dropSchedule/computeDropTime';
import { getLocalWeekStartForDate } from '../../../core/utils/localDate';

const DAY_MS = 24 * 60 * 60 * 1000;
const DROP_SCORED_WEEK_ANCHOR_MS = 2 * DAY_MS;

/**
 * Returns the Sat-Fri scored week represented by a Friday/Saturday drop.
 *
 * The live week key rolls forward at local Saturday midnight, but the drop can
 * land after that. Anchoring two days before dropAt keeps the drop tied to the
 * week that ended on the drop's Friday: the anchor falls between Wednesday
 * afternoon and Thursday evening ET, which is Wednesday–Friday local time in
 * every UTC-12…UTC+14 zone. (A one-day anchor slipped into the new week east
 * of UTC+2 for Saturday drops.)
 */
export function getScoredWeekOfDrop(dropAt: number): string {
  return getLocalWeekStartForDate(new Date(dropAt - DROP_SCORED_WEEK_ANCHOR_MS));
}

/**
 * Inverse of getScoredWeekOfDrop for the weekly schedule: the drop moment for
 * the Sat-Fri week starting `weekOf` (YYYY-MM-DD). That week's Friday falls in
 * one ISO week, whose drop is on that Friday or the Saturday after it.
 */
export function getDropAtForScoredWeek(weekOf: string): number {
  const [year, month, day] = weekOf.split('-').map(Number);
  const fridayNoonUtc = Date.UTC(year, month - 1, day + 6, 12);
  const isoWeek = getISOWeek(fridayNoonUtc);
  return computeDropTime(isoWeek.year, isoWeek.week).getTime();
}
