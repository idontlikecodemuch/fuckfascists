import { useEffect } from 'react';
import type { Entity } from '../../../core/models';
import type { StorageAdapter } from '../../../core/data';
import type { Platform } from '../../Platforms/types';
import { getNextBetaDropTime, isBetaScheduleActive } from '../../../core/dropSchedule/betaDropSchedule';
import { MIN_AVOIDS_FOR_DROP } from '../../../config/constants';
import { getScoredWeekOfDrop } from '../utils/scoredWeek';
import { getNextScorecardDropAfter } from '../utils/dropTime';
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
 * the Scorecard tab to get a drop notification. It always targets the next
 * drop that has not happened yet: inside a drop's 48h window that is next
 * week's, so opening the app only on drop weekends still schedules it. The
 * notification is scheduled only when that drop's scored week already has
 * enough avoid data to produce a card, and only while alerts are allowed
 * (`enabled`); turning them on re-runs it.
 */
export function useScorecardDropNotification(
  adapter: StorageAdapter,
  entities: Entity[],
  platforms: Platform[],
  refreshKey = 0,
  enabled = true,
): void {
  // Re-renders at the drop and when its window closes.
  const { schedule, hasDropped } = useDropSchedule();
  let targetMs = schedule.dropAt;
  if (hasDropped) {
    targetMs = isBetaScheduleActive()
      ? getNextBetaDropTime().getTime()
      : getNextScorecardDropAfter(schedule.dropAt).getTime();
  }
  const scoredWeekOf = getScoredWeekOfDrop(targetMs);
  const { data, loading } = useScorecard(adapter, entities, platforms, scoredWeekOf, refreshKey);

  useEffect(() => {
    // A drop that passed before the schedule re-rendered: wait for that render.
    if (!enabled || loading || targetMs <= Date.now()) return;
    // The target just moved to a new week and its data is still the old week's.
    if (data && data.weekOf !== scoredWeekOf) return;

    if (!data || data.grandTotal < MIN_AVOIDS_FOR_DROP) {
      cancelScorecardDropNotification().catch(() => {});
      return;
    }

    scheduleDropNotification(targetMs).catch(() => {
      // Scheduling failed — retried on the next launch or avoid.
    });
  }, [data?.grandTotal, data?.weekOf, enabled, loading, scoredWeekOf, targetMs]);
}
