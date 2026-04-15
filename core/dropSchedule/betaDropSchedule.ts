/**
 * Beta/dev override for the weekly scorecard drop schedule.
 *
 * Divides time into fixed-length periods (e.g. 48 hours) and picks a
 * deterministic drop moment within each period using the same djb2 hash
 * as the production schedule. The aggregation window (weekOf) is unchanged —
 * only the drop cadence and notification timing change.
 *
 * Self-contained — to remove this override entirely:
 *   1. Delete this file.
 *   2. Remove BETA_SCORECARD_INTERVAL_HOURS from config/constants.ts.
 *   3. Remove the betaDropSchedule conditional in useDropSchedule.ts.
 */

import { BETA_SCORECARD_INTERVAL_HOURS } from '../../config/constants';

const INTERVAL_MS = BETA_SCORECARD_INTERVAL_HOURS * 3_600_000;

// Epoch anchor — a known Monday at midnight UTC. Periods are measured from here.
// Using 2026-01-05 (a Monday) so periods align cleanly with calendar days.
const EPOCH_MS = Date.UTC(2026, 0, 5); // 2026-01-05T00:00:00Z

/** djb2 hash — same algorithm as computeDropTime.ts for consistency. */
function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (((hash << 5) + hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Returns whether the beta drop schedule is active.
 * Only true when BETA_SCORECARD_INTERVAL_HOURS > 0 (dev builds only).
 */
export function isBetaScheduleActive(): boolean {
  return BETA_SCORECARD_INTERVAL_HOURS > 0;
}

/**
 * Computes the current beta drop time.
 *
 * Divides time since epoch into fixed periods. Within each period, picks an
 * hour offset via hash. Returns the drop moment as a Date.
 */
export function getBetaDropTime(): Date {
  const now = Date.now();
  const periodIndex = Math.floor((now - EPOCH_MS) / INTERVAL_MS);
  const periodStart = EPOCH_MS + periodIndex * INTERVAL_MS;

  // Pick an hour offset within the period (leave first and last hour as buffer)
  const usableHours = Math.max(BETA_SCORECARD_INTERVAL_HOURS - 2, 1);
  const hourOffset = 1 + (djb2(`ff-beta-${periodIndex}`) % usableHours);
  const dropMs = periodStart + hourOffset * 3_600_000;

  return new Date(dropMs);
}

/**
 * Returns the drop time for the next period (used for scheduling the
 * notification when the current period's drop has already passed).
 */
export function getNextBetaDropTime(): Date {
  const now = Date.now();
  const periodIndex = Math.floor((now - EPOCH_MS) / INTERVAL_MS);
  const nextPeriodStart = EPOCH_MS + (periodIndex + 1) * INTERVAL_MS;

  const usableHours = Math.max(BETA_SCORECARD_INTERVAL_HOURS - 2, 1);
  const hourOffset = 1 + (djb2(`ff-beta-${periodIndex + 1}`) % usableHours);

  return new Date(nextPeriodStart + hourOffset * 3_600_000);
}
