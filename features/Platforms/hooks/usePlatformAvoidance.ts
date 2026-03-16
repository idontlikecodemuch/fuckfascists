import { useState, useEffect, useCallback } from 'react';
import type { StorageAdapter } from '../../../core/data';
import { recordPlatformAvoid, getAllPlatformWeeklyTotals } from '../../../core/data';
import { getLocalWeekStart } from '../../../core/utils/localDate';
import type { Platform, PlatformItem } from '../types';

export interface PlatformAvoidanceState {
  weekOf: string;
  items: PlatformItem[];
  totalAvoids: number;
  loading: boolean;
  error: string | null;
  /** Records an avoidance for the given platform today and increments the weekly tally. */
  avoid: (platformId: string) => Promise<void>;
}

/**
 * Loads the current week's per-platform avoid totals and provides an `avoid` action.
 *
 * Each tap increments the day's count — the user can avoid the same platform
 * multiple times per day (e.g. resisting the urge to open Instagram repeatedly).
 */
export function usePlatformAvoidance(
  adapter: StorageAdapter,
  platforms: Platform[]
): PlatformAvoidanceState {
  const weekOf = getLocalWeekStart();
  const [totals, setTotals] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const map = await getAllPlatformWeeklyTotals(adapter, weekOf);
        if (cancelled) return;
        setTotals(map);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        setError((err as Error).message);
      }
    })();
    return () => { cancelled = true; };
  }, [adapter, weekOf]);

  const avoid = useCallback(
    async (platformId: string) => {
      try {
        await recordPlatformAvoid(adapter, platformId);
        setTotals((prev) => {
          const next = new Map(prev);
          next.set(platformId, (next.get(platformId) ?? 0) + 1);
          return next;
        });
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [adapter]
  );

  const items: PlatformItem[] = platforms.map((platform) => ({
    platform,
    weeklyCount: totals.get(platform.id) ?? 0,
  }));

  const totalAvoids = items.reduce((sum, i) => sum + i.weeklyCount, 0);

  return { weekOf, items, totalAvoids, loading, error, avoid };
}
