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
  SCORECARD_PRESENTATION_WINDOW_MS,
} from '../../../config/constants';
import type { Platform } from '../../Platforms/types';
import type { ScorecardViewData } from '../types';
import { getDropAtForScoredWeek, getScoredWeekOfDrop } from '../utils/scoredWeek';
import { findCardForWeek, findLatestCard, type ArchivedCard } from './cardArchive';
import { parseCardWeekOf } from '../utils/formatters';
import { loadScorecardViewData } from './scorecardViewData';
import { lateCardMarker } from './weekMarkers';
import {
  readCaptureFailures,
  recordCaptureFailure,
  shouldGiveUpCapture,
  writeCaptureFailures,
  type CaptureFailures,
} from './captureFailures';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
  /**
   * Token for the current foreground session, or null while the app is not
   * active. It changes whenever the app leaves the foreground, so a capture
   * that spans a trip to the background is recognised as interrupted.
   */
  foregroundSession: () => number | null;
  nowMs?: number;
  minAvoids?: number;
  dropAtForWeek?: DropAtForWeek;
  findCard?: (weekOf: string) => Promise<ArchivedCard | null>;
  loadData?: typeof loadScorecardViewData;
  purgeWeek?: (adapter: StorageAdapter, weekOf: string) => Promise<void>;
  markLateCard?: (weekOf: string) => Promise<void>;
  /** Week of the newest card on file, or null. */
  findNewestCardWeek?: () => Promise<string | null>;
  loadFailures?: () => Promise<CaptureFailures>;
  saveFailures?: (failures: CaptureFailures) => Promise<void>;
}

export interface CapturePendingResult {
  captured: string[];
  purged: string[];
  /** Weeks whose capture failed this run; they keep their events for a retry. */
  failed: string[];
  /** Failed weeks that met the give-up rule, purged without a card. */
  abandoned: string[];
  /** The app left the foreground; the run stopped without counting a failure. */
  interrupted: boolean;
  /** Weeks captured after their presentation window (a missed drop); oldest first. */
  late: string[];
  /** The missed drop marked for its one late reveal this run, or null. */
  lateReveal: string | null;
}

async function newestArchivedCardWeek(): Promise<string | null> {
  const card = await findLatestCard();
  return card ? parseCardWeekOf(card.filename) : null;
}

/**
 * The only path that captures weekly cards and deletes raw avoid events.
 *
 * For each week with raw events whose drop has passed, oldest first:
 *   - card already archived → scoped purge of the leftovers;
 *   - fewer than minAvoids → scoped purge, no card is coming;
 *   - otherwise capture, then scoped purge. A capture more than the
 *     presentation window after its drop is late; the newest late card is marked for its one reveal.
 * A week is never purged while it is still the live local week (a Friday
 * drop): its purge happens on the first run after local midnight, so Track
 * and the live preview keep the week until it ends.
 * The run only works in the foreground: if the app is not active, or leaves
 * the foreground during a capture, it stops without counting a failure.
 * A failed capture keeps that week's events, is recorded per week
 * (captureFailures.ts) and the run moves on to later weeks; the next launch or
 * resume retries. A week is purged without a card only when
 * shouldGiveUpCapture holds (old drop, failing for days, several attempts).
 * Weeks whose drop has not passed are never read for capture or purged.
 */
export async function capturePendingScorecards({
  adapter,
  entities,
  platforms,
  captureWeek,
  foregroundSession,
  nowMs = Date.now(),
  minAvoids = MIN_AVOIDS_FOR_DROP,
  dropAtForWeek = resolveDropAtForWeek,
  findCard = findCardForWeek,
  loadData = loadScorecardViewData,
  purgeWeek = purgeScoredWeekAvoidEvents,
  markLateCard = lateCardMarker.mark,
  findNewestCardWeek = newestArchivedCardWeek,
  loadFailures = readCaptureFailures,
  saveFailures = writeCaptureFailures,
}: CapturePendingInput): Promise<CapturePendingResult> {
  const result: CapturePendingResult = {
    captured: [], purged: [], failed: [], abandoned: [], interrupted: false, late: [], lateReveal: null,
  };
  const liveWeekOf = getLocalWeekStartForDate(new Date(nowMs));
  const eventWeeks = await listAvoidEventWeeks(adapter);
  const failures = await loadFailures();
  const failuresBefore = JSON.stringify(failures);
  // A week whose events are gone has nothing left to retry.
  for (const weekOf of Object.keys(failures)) {
    if (!eventWeeks.includes(weekOf)) delete failures[weekOf];
  }

  // Scoped purge, skipped while the week is still the live local week.
  const purge = async (weekOf: string): Promise<boolean> => {
    if (weekOf >= liveWeekOf) return false;
    try {
      await purgeWeek(adapter, weekOf);
      result.purged.push(weekOf);
      delete failures[weekOf];
      return true;
    } catch {
      return false; // Non-fatal: leftovers are purged on a later run.
    }
  };

  for (const weekOf of eventWeeks) {
    const dropAt = dropAtForWeek(weekOf, nowMs);
    if (!Number.isFinite(dropAt) || dropAt > nowMs) continue;

    const session = foregroundSession();
    if (session === null) {
      result.interrupted = true;
      break;
    }

    let captured = false;
    try {
      if (await findCard(weekOf)) {
        await purge(weekOf);
        continue;
      }

      const data = await loadData(adapter, entities, platforms, weekOf);
      if (data.grandTotal < minAvoids) {
        await purge(weekOf);
        continue;
      }

      captured = await captureWeek(weekOf, data);
    } catch {
      captured = false;
    }

    if (!captured) {
      if (foregroundSession() !== session) {
        result.interrupted = true;
        break;
      }
      result.failed.push(weekOf);
      const failure = recordCaptureFailure(failures, weekOf, nowMs);
      if (shouldGiveUpCapture(failure, dropAt, nowMs) && await purge(weekOf)) {
        result.abandoned.push(weekOf);
      }
      continue;
    }

    delete failures[weekOf];
    result.captured.push(weekOf);
    if (nowMs - dropAt >= SCORECARD_PRESENTATION_WINDOW_MS) result.late.push(weekOf);
    await purge(weekOf);
  }

  // Missed drops get one reveal: the newest late card, marked only once the
  // run has finished and only while it is the newest card on file, so an
  // interrupted run, an in-window newer card, or an older week that finally
  // captured after a newer one never takes the reveal.
  const newestLate = result.late[result.late.length - 1];
  if (newestLate && !result.interrupted &&
    (await findNewestCardWeek().catch(() => null)) === newestLate) {
    await markLateCard(newestLate).catch(() => undefined);
    result.lateReveal = newestLate;
  }

  if (JSON.stringify(failures) !== failuresBefore) await saveFailures(failures);

  return result;
}
