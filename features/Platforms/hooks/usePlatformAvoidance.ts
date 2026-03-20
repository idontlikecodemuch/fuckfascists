import { useState, useEffect, useCallback } from 'react';
import type { StorageAdapter } from '../../../core/data';
import {
  recordPlatformAvoid,
  recordPlatformAvoidForDate,
  getPlatformAvoidsForWeek,
} from '../../../core/data';
import { getLocalWeekStart, getLocalDateString } from '../../../core/utils/localDate';
import type { Platform, PlatformItem } from '../types';
import type { PlatformAvoidEvent } from '../../../core/models';

export interface PlatformAvoidanceState {
  weekOf: string;
  items: PlatformItem[];
  totalAvoids: number;
  loading: boolean;
  error: string | null;
  /** Records an avoidance for the given platform today and increments the weekly tally. */
  avoid: (platformId: string) => Promise<void>;
  /** Records an avoidance for the given platform on a specific date. */
  avoidForDate: (platformId: string, date: string) => Promise<void>;
  /** Clears all platform avoid events. Dev/testing only. */
  clearAll: () => Promise<void>;
}

/**
 * Loads the current week's per-platform avoid events (with day-level detail)
 * and provides `avoid` and `avoidForDate` actions.
 *
 * Each tap increments the day's count — the user can avoid the same platform
 * multiple times per day (e.g. resisting the urge to open Instagram repeatedly).
 */
export function usePlatformAvoidance(
  adapter: StorageAdapter,
  platforms: Platform[]
): PlatformAvoidanceState {
  const weekOf = getLocalWeekStart();
  const [events, setEvents] = useState<PlatformAvoidEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await getPlatformAvoidsForWeek(adapter, weekOf);
        if (cancelled) return;
        setEvents(result);
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
        const today = getLocalDateString();
        setEvents((prev) => [...prev, { platformId, date: today, count: 1 }]);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [adapter]
  );

  const avoidForDate = useCallback(
    async (platformId: string, date: string) => {
      try {
        await recordPlatformAvoidForDate(adapter, platformId, date);
        setEvents((prev) => [...prev, { platformId, date, count: 1 }]);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [adapter]
  );

  const clearAll = useCallback(
    async () => {
      try {
        await adapter.clearAllPlatformAvoids();
        setEvents([]);
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [adapter]
  );

  const items: PlatformItem[] = platforms.map((platform) => {
    const platformEvents = events.filter((e) => e.platformId === platform.id);
    const dayCounts = new Map<string, number>();
    for (const e of platformEvents) {
      dayCounts.set(e.date, (dayCounts.get(e.date) ?? 0) + e.count);
    }
    const weeklyCount = platformEvents.reduce((sum, e) => sum + e.count, 0);
    return { platform, weeklyCount, dayCounts };
  });

  const totalAvoids = items.reduce((sum, i) => sum + i.weeklyCount, 0);

  return { weekOf, items, totalAvoids, loading, error, avoid, avoidForDate, clearAll };
}
