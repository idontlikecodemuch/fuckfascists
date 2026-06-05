import type { Entity } from '../../../core/models';
import type { StorageAdapter } from '../../../core/data';
import type { Platform } from '../../Platforms/types';
import { aggregateScorecard } from '../data/aggregateScorecard';
import { findCardForWeek, type ArchivedCard } from '../data/cardArchive';
import { getScoredWeekOfDrop } from './scoredWeek';
import { getScorecardDropTimeForTimestamp } from './dropTime';
import {
  getBetaDropTimeForTimestamp,
  isBetaScheduleActive,
} from '../../../core/dropSchedule/betaDropSchedule';
import {
  MIN_AVOIDS_FOR_DROP,
  SCORECARD_PRESENTATION_WINDOW_MS,
} from '../../../config/constants';

type AggregateScorecardFn = typeof aggregateScorecard;
type FindArchivedCardFn = (weekOf: string) => Promise<ArchivedCard | null>;

interface PendingDropLaunchInput {
  adapter: StorageAdapter;
  entities: Entity[];
  platforms: Platform[];
  nowMs?: number;
  minAvoids?: number;
  aggregate?: AggregateScorecardFn;
  findArchivedCard?: FindArchivedCardFn;
}

function getDropAtForTimestamp(nowMs: number): number {
  if (isBetaScheduleActive()) {
    return getBetaDropTimeForTimestamp(nowMs).getTime();
  }
  return getScorecardDropTimeForTimestamp(nowMs).getTime();
}

export function getPendingScorecardDropWeek(nowMs = Date.now()): string | null {
  const dropAt = getDropAtForTimestamp(nowMs);
  const elapsedMs = nowMs - dropAt;

  if (elapsedMs < 0 || elapsedMs >= SCORECARD_PRESENTATION_WINDOW_MS) {
    return null;
  }

  return getScoredWeekOfDrop(dropAt);
}

export async function shouldLaunchPendingScorecardDrop({
  adapter,
  entities,
  platforms,
  nowMs = Date.now(),
  minAvoids = MIN_AVOIDS_FOR_DROP,
  aggregate = aggregateScorecard,
  findArchivedCard = findCardForWeek,
}: PendingDropLaunchInput): Promise<boolean> {
  const scoredWeekOf = getPendingScorecardDropWeek(nowMs);
  if (!scoredWeekOf) return false;

  try {
    const existing = await findArchivedCard(scoredWeekOf);
    if (existing) return false;

    const persons = await aggregate(adapter, entities, platforms, scoredWeekOf);
    const grandTotal = persons.reduce((sum, person) => sum + person.totalCount, 0);
    return grandTotal >= minAvoids;
  } catch {
    return false;
  }
}
