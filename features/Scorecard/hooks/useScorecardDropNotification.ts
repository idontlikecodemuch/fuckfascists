import { useEffect } from 'react';
import type { Entity } from '../../../core/models';
import type { StorageAdapter } from '../../../core/data';
import type { Platform } from '../../Platforms/types';
import { getNextBetaDropTime, isBetaScheduleActive } from '../../../core/dropSchedule/betaDropSchedule';
import { MIN_AVOIDS_FOR_DROP } from '../../../config/constants';
import { getScoredWeekOfDrop } from '../utils/scoredWeek';
import { useScorecard } from './useScorecard';
import {
  cancelScorecardDropNotification,
  scheduleDropNotification,
  useDropSchedule,
} from './useDropSchedule';

/**
 * App-shell notification scheduler for the weekly scorecard drop.
 *
 * Runs at app startup and after avoid writes, so users do not need to visit
 * the Scorecard tab to get a drop notification. The notification is scheduled
 * only when the scored week currently has enough avoid data to produce a card.
 */
export function useScorecardDropNotification(
  adapter: StorageAdapter,
  entities: Entity[],
  platforms: Platform[],
  refreshKey = 0,
): void {
  const { schedule, hasDropped } = useDropSchedule();
  const targetMs = isBetaScheduleActive() && hasDropped
    ? getNextBetaDropTime().getTime()
    : schedule.dropAt;
  const scoredWeekOf = getScoredWeekOfDrop(targetMs);
  const { data, loading } = useScorecard(adapter, entities, platforms, scoredWeekOf, refreshKey);

  useEffect(() => {
    if (loading) return;

    // Production drops do not schedule the next week until the ISO week rolls
    // forward. Beta mode handles current-period drops via getNextBetaDropTime().
    if (targetMs <= Date.now()) return;

    if (!data || data.grandTotal < MIN_AVOIDS_FOR_DROP) {
      cancelScorecardDropNotification().catch(() => {});
      return;
    }

    scheduleDropNotification(targetMs).catch(() => {
      // Permission denied or scheduling failed — silently skip.
    });
  }, [data?.grandTotal, loading, targetMs]);
}
