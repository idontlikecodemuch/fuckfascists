import React, { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { StorageAdapter } from '../../../core/data';
import type { Platform, PlatformItem } from '../types';
import { usePlatformAvoidance } from '../hooks/usePlatformAvoidance';
import { getLocalDateString } from '../../../core/utils/localDate';

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
  /** Set of platform IDs whose day circles are currently expanded. */
  expandedIds: Set<string>;
  /** Toggle a single platform's day circles open/closed. */
  toggleExpand: (platformId: string) => void;
  /** Expand all given platform IDs (used by daily open animation). */
  expandAll: (ids: string[]) => void;
  /** Collapse a single platform ID (used by stagger-collapse). */
  collapseOne: (id: string) => void;
  /** All platform avoid data for the week. */
  weekAvoids: PlatformItem[];
  /** Total avoids across all platforms this week. */
  totalAvoids: number;
  /** Monday of the current week (YYYY-MM-DD). */
  weekOf: string;
  /** Set of publicFigureNames that received any avoid action today. Resets daily. */
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
  /** Whether a person's sprite should show as defeated (any avoid today). */
  isDefeated: (figureName: string) => boolean;
  /** Clears all platform avoid data. Dev/testing only. */
  clearAll: () => Promise<void>;
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
  const [focusedPlatformId, rawSetFocusedPlatformId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // When focus changes, collapse all previously expanded rows (per UX spec).
  const setFocusedPlatformId = useCallback((id: string | null) => {
    rawSetFocusedPlatformId((prev) => {
      if (prev !== id) {
        setExpandedIds(new Set());
      }
      return id;
    });
  }, []);

  const toggleExpand = useCallback((platformId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(platformId)) {
        next.delete(platformId);
      } else {
        next.add(platformId);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback((ids: string[]) => {
    setExpandedIds(new Set(ids));
  }, []);

  const collapseOne = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const avoidance = usePlatformAvoidance(adapter, platforms);

  // todayActions: set of publicFigureNames with any avoid today.
  // Resets on app open via local date comparison stored in a ref.
  const sessionDateRef = useRef(getLocalDateString());
  const [todayActions, setTodayActions] = useState<Set<string>>(() => {
    return buildTodayActions(avoidance.items, platforms, sessionDateRef.current);
  });

  // Rebuild todayActions when items change (new avoids come in) or day rolls over.
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
    // Any avoid action (including past-day backfills) marks the person as acted-upon today
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
  }, [avoidance.avoidForDate, platforms]);

  const personWeeklyAvoids = useCallback((figureName: string): number => {
    return avoidance.items
      .filter((item) => getDisplayFigure(item.platform) === figureName)
      .reduce((sum, item) => sum + item.weeklyCount, 0);
  }, [avoidance.items]);

  // Defeated = any avoid action taken against this person during the current calendar day
  const isDefeated = useCallback((figureName: string): boolean => {
    return todayActions.has(figureName);
  }, [todayActions]);

  const clearAll = useCallback(async () => {
    await avoidance.clearAll();
    setTodayActions(new Set());
    rawSetFocusedPlatformId(null);
    setExpandedIds(new Set());
  }, [avoidance.clearAll]);

  const value = useMemo<TrackContextValue>(() => ({
    focusedPlatformId,
    setFocusedPlatformId,
    expandedIds,
    toggleExpand,
    expandAll,
    collapseOne,
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
    clearAll,
  }), [
    focusedPlatformId, expandedIds, avoidance.items, avoidance.totalAvoids,
    avoidance.weekOf, todayActions, avoid, avoidForDate,
    avoidance.loading, avoidance.error, platforms,
    personWeeklyAvoids, isDefeated, clearAll,
    setFocusedPlatformId, toggleExpand, expandAll, collapseOne,
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
