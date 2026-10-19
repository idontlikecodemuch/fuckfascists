import type { Entity } from '../../../core/models';
import type { StorageAdapter } from '../../../core/data';
import { purgeScoredWeekAvoidEvents } from '../../../core/data';
import { getLocalWeekStartForDate } from '../../../core/utils/localDate';
import {
  getBetaDropTimeForTimestamp,
  isBetaScheduleActive,
} from '../../../core/dropSchedule/betaDropSchedule';
import {
  BETA_SCORECARD_INTERVAL_HOURS,
  MIN_AVOIDS_FOR_DROP,
  SCORECARD_CAPTURE_GIVE_UP_DAYS,
  SCORECARD_PRESENTATION_WINDOW_MS,
} from '../../../config/constants';
import type { Platform } from '../../Platforms/types';
import type { ScorecardViewData } from '../types';
import { cancelScorecardDropNotification } from '../hooks/useDropSchedule';
import { getDropAtForScoredWeek, getScoredWeekOfDrop } from '../utils/scoredWeek';
import { getPendingScorecardDropWeek } from '../utils/pendingDropLaunch';
import { findCardForWeek, type ArchivedCard } from './cardArchive';
import { loadScorecardViewData } from './scorecardViewData';
import { lateCardMarker } from './weekMarkers';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export type DropAtForWeek = (weekOf: string, nowMs: number) => number;

/**
 * Drop moment for a scored week. Weekly schedule: the inverse of
 * getScoredWeekOfDrop. Beta cadence: weeks up to the latest passed beta drop's
 * scored week share that drop; later weeks have not dropped.
 */
export function resolveDropAtForWeek(weekOf: string, nowMs: number): number {
  if (!isBetaScheduleActive()) return getDropAtForScoredWeek(weekOf);

  const current = getBetaDropTimeForTimestamp(nowMs).getTime();
  const latest = current <= nowMs
    ? current
    : getBetaDropTimeForTimestamp(nowMs - BETA_SCORECARD_INTERVAL_HOURS * 3_600_000).getTime();
  return weekOf <= getScoredWeekOfDrop(latest) ? latest : Number.POSITIVE_INFINITY;
}

/** Distinct local Sat-Fri weeks that still hold raw avoid events, oldest first. */
export async function listAvoidEventWeeks(adapter: StorageAdapter): Promise<string[]> {
  const [entityEvents, platformEvents] = await Promise.all([
    adapter.getEntityAvoids(),
    adapter.getPlatformAvoids(),
  ]);
  const weeks = new Set<string>();
  for (const { date } of [...entityEvents, ...platformEvents]) {
    if (!DATE_PATTERN.test(date)) continue;
    const [year, month, day] = date.split('-').map(Number);
    weeks.add(getLocalWeekStartForDate(new Date(year, month - 1, day)));
  }
  return [...weeks].sort();
}

export interface CapturePendingInput {
  adapter: StorageAdapter;
  entities: Entity[];
  platforms: Platform[];
  /** Renders and saves the card for one week. Resolves true on success. */
  captureWeek: (weekOf: string, data: ScorecardViewData) => Promise<boolean>;
  nowMs?: number;
  minAvoids?: number;
  dropAtForWeek?: DropAtForWeek;
  /** The week whose drop is inside the presentation window, if any. */
  windowWeek?: string | null;
  findCard?: (weekOf: string) => Promise<ArchivedCard | null>;
  loadData?: typeof loadScorecardViewData;
  purgeWeek?: (adapter: StorageAdapter, weekOf: string) => Promise<void>;
  markLateCard?: (weekOf: string) => Promise<void>;
  cancelDropNotification?: () => Promise<void>;
}

export interface CapturePendingResult {
  captured: string[];
  purged: string[];
  /** Weeks whose capture failed this run; they keep their events for a retry. */
  failed: string[];
  /** Failed weeks past SCORECARD_CAPTURE_GIVE_UP_DAYS, purged without a card. */
  abandoned: string[];
}

/**
 * The only path that captures weekly cards and deletes raw avoid events.
 *
 * For each week with raw events whose drop has passed, oldest first:
 *   - card already archived → scoped purge of the leftovers;
 *   - fewer than minAvoids → scoped purge, no card is coming;
 *   - otherwise capture, then scoped purge. A capture more than the
 *     presentation window after its drop is marked for the late-card notice.
 * A week is never purged while it is still the live local week (a Friday
 * drop): its purge happens on the first run after local midnight, so Track
 * and the live preview keep the week until it ends.
 * A failed capture keeps that week's events and the run moves on to later
 * weeks; the next launch or resume retries. A week still failing
 * SCORECARD_CAPTURE_GIVE_UP_DAYS after its drop is purged without a card.
 * Weeks whose drop has not passed are never read for capture or purged.
 */
export async function capturePendingScorecards({
  adapter,
  entities,
  platforms,
  captureWeek,
  nowMs = Date.now(),
  minAvoids = MIN_AVOIDS_FOR_DROP,
  dropAtForWeek = resolveDropAtForWeek,
  windowWeek = getPendingScorecardDropWeek(nowMs),
  findCard = findCardForWeek,
  loadData = loadScorecardViewData,
  purgeWeek = purgeScoredWeekAvoidEvents,
  markLateCard = lateCardMarker.mark,
  cancelDropNotification = cancelScorecardDropNotification,
}: CapturePendingInput): Promise<CapturePendingResult> {
  const result: CapturePendingResult = { captured: [], purged: [], failed: [], abandoned: [] };
  const liveWeekOf = getLocalWeekStartForDate(new Date(nowMs));
  const eventWeeks = await listAvoidEventWeeks(adapter);
  const belowMinimum = new Set<string>();

  // Scoped purge, skipped while the week is still the live local week.
  const purge = async (weekOf: string): Promise<boolean> => {
    if (weekOf >= liveWeekOf) return false;
    try {
      await purgeWeek(adapter, weekOf);
      result.purged.push(weekOf);
      return true;
    } catch {
      return false; // Non-fatal: leftovers are purged on a later run.
    }
  };

  for (const weekOf of eventWeeks) {
    const dropAt = dropAtForWeek(weekOf, nowMs);
    if (!Number.isFinite(dropAt) || dropAt > nowMs) continue;

    let captured = false;
    try {
      if (await findCard(weekOf)) {
        await purge(weekOf);
        continue;
      }

      const data = await loadData(adapter, entities, platforms, weekOf);
      if (data.grandTotal < minAvoids) {
        belowMinimum.add(weekOf);
        await purge(weekOf);
        continue;
      }

      captured = await captureWeek(weekOf, data);
    } catch {
      captured = false;
    }

    if (!captured) {
      result.failed.push(weekOf);
      if (nowMs - dropAt > SCORECARD_CAPTURE_GIVE_UP_DAYS * DAY_MS && await purge(weekOf)) {
        result.abandoned.push(weekOf);
      }
      continue;
    }

    result.captured.push(weekOf);
    if (nowMs - dropAt >= SCORECARD_PRESENTATION_WINDOW_MS) {
      await markLateCard(weekOf).catch(() => undefined);
    }
    await purge(weekOf);
  }

  // Empty in-window drop: no card is coming, so cancel only the scorecard
  // notification (a quiet-hours drop may still be waiting for 9am). The
  // Thursday platform nudge has its own identifier and is untouched.
  if (windowWeek && (belowMinimum.has(windowWeek) || !eventWeeks.includes(windowWeek))) {
    const card = await findCard(windowWeek).catch(() => null);
    if (!card) await cancelDropNotification().catch(() => undefined);
  }

  return result;
}
