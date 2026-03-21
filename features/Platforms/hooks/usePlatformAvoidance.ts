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
  avoid: (platformId: string) => Promise<boolean>;
  /** Records an avoidance for the given platform on a specific date. */
  avoidForDate: (platformId: string, date: string) => Promise<boolean>;
  /** Clears all platform avoid events. Dev/testing only. */
  clearAll: () => Promise<void>;
}

/**
 * Loads the current week's per-platform avoid events (with day-level detail)
 * and provides `avoid` and `avoidForDate` actions.
 *
 * Platform avoids are binary per calendar day: one avoid per platform, per day.
 * Legacy overcounted events are normalized to a single daily mark in the Track UI.
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
        setEvents(normalizePlatformEvents(result));
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
        const today = getLocalDateString();
        const recorded = await recordPlatformAvoid(adapter, platformId);
        if (!recorded) return false;
        setEvents((prev) => {
          if (hasPlatformAvoidForDate(prev, platformId, today)) return prev;
          return [...prev, { platformId, date: today, count: 1 }];
        });
        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
      }
    },
    [adapter]
  );

  const avoidForDate = useCallback(
    async (platformId: string, date: string) => {
      try {
        const recorded = await recordPlatformAvoidForDate(adapter, platformId, date);
        if (!recorded) return false;
        setEvents((prev) => {
          if (hasPlatformAvoidForDate(prev, platformId, date)) return prev;
          return [...prev, { platformId, date, count: 1 }];
        });
        return true;
      } catch (err) {
        setError((err as Error).message);
        return false;
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

function normalizePlatformEvents(events: PlatformAvoidEvent[]): PlatformAvoidEvent[] {
  const deduped = new Map<string, PlatformAvoidEvent>();

  for (const event of events) {
    if (event.count <= 0) continue;
    const key = `${event.platformId}:${event.date}`;
    if (deduped.has(key)) continue;
    deduped.set(key, { ...event, count: 1 });
  }

  return Array.from(deduped.values());
}

function hasPlatformAvoidForDate(
  events: PlatformAvoidEvent[],
  platformId: string,
  date: string,
): boolean {
  return events.some((event) => event.platformId === platformId && event.date === date && event.count > 0);
}
