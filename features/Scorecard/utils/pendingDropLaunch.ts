import type { Entity } from '../../../core/models';
import type { StorageAdapter } from '../../../core/data';
import type { Platform } from '../../Platforms/types';
import { aggregateScorecard } from '../data/aggregateScorecard';
import { findCardForWeek, type ArchivedCard } from '../data/cardArchive';
import { revealedWeekMarker } from '../data/weekMarkers';
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
type ReadRevealedWeekFn = () => Promise<string | null>;

interface PendingDropLaunchInput {
  adapter: StorageAdapter;
  entities: Entity[];
  platforms: Platform[];
  nowMs?: number;
  minAvoids?: number;
  aggregate?: AggregateScorecardFn;
  findArchivedCard?: FindArchivedCardFn;
  readRevealedWeek?: ReadRevealedWeekFn;
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

/**
 * Whether launch or resume should open Scorecard: a drop inside its 48h
 * window that the user has not seen yet (revealedWeekMarker), whose week has
 * a card or enough avoids for one. The shell may have captured the card from
 * another tab already, so an existing card still routes until it is revealed.
 */
export async function shouldLaunchPendingScorecardDrop({
  adapter,
  entities,
  platforms,
  nowMs = Date.now(),
  minAvoids = MIN_AVOIDS_FOR_DROP,
  aggregate = aggregateScorecard,
  findArchivedCard = findCardForWeek,
  readRevealedWeek = revealedWeekMarker.read,
}: PendingDropLaunchInput): Promise<boolean> {
  const scoredWeekOf = getPendingScorecardDropWeek(nowMs);
  if (!scoredWeekOf) return false;

  try {
    if ((await readRevealedWeek()) === scoredWeekOf) return false;
    if (await findArchivedCard(scoredWeekOf)) return true;

    const persons = await aggregate(adapter, entities, platforms, scoredWeekOf);
    const grandTotal = persons.reduce((sum, person) => sum + person.totalCount, 0);
    return grandTotal >= minAvoids;
  } catch {
    return false;
  }
}
