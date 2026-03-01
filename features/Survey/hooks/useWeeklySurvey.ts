import { useState, useEffect, useCallback } from 'react';
import type { StorageAdapter } from '../../../core/data';
import { getMondayOf, recordPlatformAvoid } from '../../../core/data';
import type { Platform, SurveyItem } from '../types';
import { buildSurveyItems } from '../utils/surveyHelpers';

export interface WeeklySurveyState {
  weekOf: string;
  items: SurveyItem[];
  loading: boolean;
  /** Marks a platform as avoided for the current week and persists immediately. */
  avoid: (platformId: string) => Promise<void>;
}

/**
 * Loads the current week's avoidance state and provides an `avoid` action.
 *
 * Tapping "avoided" on a platform is a one-way, immediate write — matching
 * the product principle that only affirmative avoidance is recorded.
 * Once avoided, a platform stays checked for the rest of the week.
 */
export function useWeeklySurvey(
  adapter: StorageAdapter,
  platforms: Platform[]
): WeeklySurveyState {
  const weekOf = getMondayOf(new Date());
  const [avoidedIds, setAvoidedIds] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    adapter.getPlatformAvoids(weekOf).then((events) => {
      if (cancelled) return;
      setAvoidedIds(new Set(events.map((e) => e.platformId)));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [adapter, weekOf]);

  const avoid = useCallback(
    async (platformId: string) => {
      if (avoidedIds.has(platformId)) return; // idempotent
      await recordPlatformAvoid(adapter, platformId);
      setAvoidedIds((prev) => new Set([...prev, platformId]));
    },
    [adapter, avoidedIds]
  );

  const items = buildSurveyItems(platforms, avoidedIds);

  return { weekOf, items, loading, avoid };
}
