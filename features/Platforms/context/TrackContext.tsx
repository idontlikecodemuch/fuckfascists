import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { StorageAdapter } from '../../../core/data';
import type { Platform, PlatformItem } from '../types';
import { usePlatformAvoidance } from '../hooks/usePlatformAvoidance';
import { getLocalDateString } from '../../../core/utils/localDate';
import { nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { SPRITE_DEFEATED_THRESHOLD } from '../../../config/constants';

// ── Public figure helpers ────────────────────────────────────────────────────

/** Resolve the display figure name for a platform (publicFigureName ?? ceoName). */
export function getDisplayFigure(p: Platform): string {
  return p.publicFigureName ?? p.ceoName;
}

// ── Context value ────────────────────────────────────────────────────────────

export interface TrackContextValue {
  /** Currently focused platform ID, or null for the grid overview. */
  focusedPlatformId: string | null;
  setFocusedPlatformId: (id: string | null) => void;
  /** All platform avoid data for the week. */
  weekAvoids: PlatformItem[];
  /** Total avoids across all platforms this week. */
  totalAvoids: number;
  /** Monday of the current week (YYYY-MM-DD). */
  weekOf: string;
  /** Set of publicFigureNames that received any avoid action today. */
  todayActions: Set<string>;
  /** Record an avoid for a platform today. */
  avoid: (platformId: string) => Promise<void>;
  /** Record an avoid for a platform on a specific date. */
  avoidForDate: (platformId: string, date: string) => Promise<void>;
  /** Loading state from data layer. */
  loading: boolean;
  /** Error from data layer. */
  error: string | null;
  /** Active platforms (filtered by user roster). */
  platforms: Platform[];
  /** Resolve weekly avoids for a specific person (summed across all their platforms). */
  personWeeklyAvoids: (figureName: string) => number;
  /** Whether a person's sprite should show as defeated. */
  isDefeated: (figureName: string) => boolean;
}

const TrackCtx = createContext<TrackContextValue | null>(null);

export function useTrack(): TrackContextValue {
  const ctx = useContext(TrackCtx);
  if (!ctx) throw new Error('useTrack must be used within TrackProvider');
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────

interface TrackProviderProps {
  adapter: StorageAdapter;
  platforms: Platform[];
  children: ReactNode;
}

export function TrackProvider({ adapter, platforms, children }: TrackProviderProps) {
  const [focusedPlatformId, setFocusedPlatformId] = useState<string | null>(null);

  const avoidance = usePlatformAvoidance(adapter, platforms);

  // todayActions: set of publicFigureNames with any avoid today.
  // Resets on app open via local date comparison stored in a ref.
  const sessionDateRef = useRef(getLocalDateString());
  const [todayActions, setTodayActions] = useState<Set<string>>(() => {
    return buildTodayActions(avoidance.items, platforms, sessionDateRef.current);
  });

  // Rebuild todayActions when items change (new avoids come in).
  useEffect(() => {
    const today = getLocalDateString();
    if (today !== sessionDateRef.current) {
      sessionDateRef.current = today;
    }
    setTodayActions(buildTodayActions(avoidance.items, platforms, sessionDateRef.current));
  }, [avoidance.items, platforms]);

  const avoid = useCallback(async (platformId: string) => {
    await avoidance.avoid(platformId);
    const platform = platforms.find((p) => p.id === platformId);
    if (platform) {
      const figure = getDisplayFigure(platform);
      setTodayActions((prev) => {
        if (prev.has(figure)) return prev;
        const next = new Set(prev);
        next.add(figure);
        return next;
      });
    }
  }, [avoidance.avoid, platforms]);

  const avoidForDate = useCallback(async (platformId: string, date: string) => {
    await avoidance.avoidForDate(platformId, date);
    // Only add to todayActions if the date is today
    if (date === sessionDateRef.current) {
      const platform = platforms.find((p) => p.id === platformId);
      if (platform) {
        const figure = getDisplayFigure(platform);
        setTodayActions((prev) => {
          if (prev.has(figure)) return prev;
          const next = new Set(prev);
          next.add(figure);
          return next;
        });
      }
    }
  }, [avoidance.avoidForDate, platforms]);

  const personWeeklyAvoids = useCallback((figureName: string): number => {
    return avoidance.items
      .filter((item) => getDisplayFigure(item.platform) === figureName)
      .reduce((sum, item) => sum + item.weeklyCount, 0);
  }, [avoidance.items]);

  const isDefeated = useCallback((figureName: string): boolean => {
    return personWeeklyAvoids(figureName) >= SPRITE_DEFEATED_THRESHOLD;
  }, [personWeeklyAvoids]);

  const value = useMemo<TrackContextValue>(() => ({
    focusedPlatformId,
    setFocusedPlatformId,
    weekAvoids: avoidance.items,
    totalAvoids: avoidance.totalAvoids,
    weekOf: avoidance.weekOf,
    todayActions,
    avoid,
    avoidForDate,
    loading: avoidance.loading,
    error: avoidance.error,
    platforms,
    personWeeklyAvoids,
    isDefeated,
  }), [
    focusedPlatformId, avoidance.items, avoidance.totalAvoids,
    avoidance.weekOf, todayActions, avoid, avoidForDate,
    avoidance.loading, avoidance.error, platforms,
    personWeeklyAvoids, isDefeated,
  ]);

  return <TrackCtx.Provider value={value}>{children}</TrackCtx.Provider>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildTodayActions(
  items: PlatformItem[],
  platforms: Platform[],
  today: string,
): Set<string> {
  const actions = new Set<string>();
  for (const item of items) {
    if ((item.dayCounts.get(today) ?? 0) > 0) {
      const figure = getDisplayFigure(item.platform);
      actions.add(figure);
    }
  }
  return actions;
}
