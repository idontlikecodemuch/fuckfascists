import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import type { StorageAdapter } from '../../../core/data';
import type { Platform, PlatformItem } from '../types';
import { usePlatformAvoidance } from '../hooks/usePlatformAvoidance';
import { getLocalDateString } from '../../../core/utils/localDate';
import type { ArenaHitRequest } from './trackHelpers';
import { buildTodayActions } from './trackHelpers';
import { initialTrackUIState, trackUIReducer } from './trackUIState';

// ── Public figure helpers ────────────────────────────────────────────────────

/** Resolve the display figure name for a platform (publicFigureName ?? ceoName). */
export function getDisplayFigure(platform: Platform): string {
  return platform.publicFigureName ?? platform.ceoName;
}

// ── Context value ────────────────────────────────────────────────────────────

export interface TrackContextValue {
  focusedPlatformId: string | null;
  focusedFigureName: string | null;
  expandedIds: Set<string>;
  focusRow: (platformId: string) => void;
  focusGroup: (figureName: string) => void;
  clearFocus: () => void;
  toggleRowExpansion: (platformId: string) => void;
  focusAndExpandRow: (platformId: string) => void;
  expandAll: (ids: string[]) => void;
  collapseOne: (platformId: string) => void;
  weekAvoids: PlatformItem[];
  totalAvoids: number;
  weekOf: string;
  todayActions: Set<string>;
  avoid: (platformId: string) => Promise<boolean>;
  avoidForDate: (platformId: string, date: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  platforms: Platform[];
  personWeeklyAvoids: (figureName: string) => number;
  isDefeated: (figureName: string) => boolean;
  arenaHitRequest: ArenaHitRequest | null;
  queueArenaHit: (figureName: string, delayMs?: number) => void;
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
  const [uiState, dispatch] = useReducer(trackUIReducer, initialTrackUIState);
  const [arenaHitRequest, setArenaHitRequest] = useState<ArenaHitRequest | null>(null);
  const avoidance = usePlatformAvoidance(adapter, platforms);

  const focusRow = useCallback((platformId: string) => {
    dispatch({ type: 'focus-row', platformId });
  }, []);

  const focusGroup = useCallback((figureName: string) => {
    dispatch({ type: 'focus-group', figureName });
  }, []);

  const clearFocus = useCallback(() => {
    dispatch({ type: 'clear-focus' });
  }, []);

  const toggleRowExpansion = useCallback((platformId: string) => {
    dispatch({ type: 'toggle-row-expansion', platformId });
  }, []);

  const focusAndExpandRow = useCallback((platformId: string) => {
    dispatch({ type: 'focus-and-expand-row', platformId });
  }, []);

  const expandAll = useCallback((ids: string[]) => {
    dispatch({ type: 'expand-all', ids });
  }, []);

  const collapseOne = useCallback((platformId: string) => {
    dispatch({ type: 'collapse-one', platformId });
  }, []);

  const queueArenaHit = useCallback((figureName: string, delayMs = 0) => {
    setArenaHitRequest({
      id: Date.now() + Math.floor(Math.random() * 1000),
      figureName,
      delayMs,
    });
  }, []);

  const sessionDateRef = useRef(getLocalDateString());
  const [todayActions, setTodayActions] = useState<Set<string>>(() =>
    buildTodayActions(avoidance.items, sessionDateRef.current, getDisplayFigure),
  );

  useEffect(() => {
    const today = getLocalDateString();
    if (today !== sessionDateRef.current) {
      sessionDateRef.current = today;
    }
    setTodayActions(buildTodayActions(avoidance.items, sessionDateRef.current, getDisplayFigure));
  }, [avoidance.items]);

  const avoid = useCallback(async (platformId: string) => {
    const recorded = await avoidance.avoid(platformId);
    if (!recorded) return false;

    const platform = platforms.find((item) => item.id === platformId);
    if (platform) {
      const figureName = getDisplayFigure(platform);
      setTodayActions((prev) => {
        if (prev.has(figureName)) return prev;
        const next = new Set(prev);
        next.add(figureName);
        return next;
      });
    }

    return true;
  }, [avoidance, platforms]);

  const avoidForDate = useCallback(async (platformId: string, date: string) => {
    const recorded = await avoidance.avoidForDate(platformId, date);
    if (!recorded) return false;

    const platform = platforms.find((item) => item.id === platformId);
    if (platform) {
      const figureName = getDisplayFigure(platform);
      setTodayActions((prev) => {
        if (prev.has(figureName)) return prev;
        const next = new Set(prev);
        next.add(figureName);
        return next;
      });
    }

    return true;
  }, [avoidance, platforms]);

  const personWeeklyAvoids = useCallback((figureName: string): number => {
    return avoidance.items
      .filter((item) => getDisplayFigure(item.platform) === figureName)
      .reduce((sum, item) => sum + item.weeklyCount, 0);
  }, [avoidance.items]);

  const isDefeated = useCallback((figureName: string): boolean => {
    return todayActions.has(figureName);
  }, [todayActions]);

  const clearAll = useCallback(async () => {
    await avoidance.clearAll();
    setTodayActions(new Set());
    setArenaHitRequest(null);
    dispatch({ type: 'reset' });
  }, [avoidance]);

  const focusedFigureName = useMemo(() => {
    if (!uiState.focusedPlatformId) return null;
    const focusedPlatform = platforms.find((platform) => platform.id === uiState.focusedPlatformId);
    return focusedPlatform ? getDisplayFigure(focusedPlatform) : uiState.focusedPlatformId;
  }, [platforms, uiState.focusedPlatformId]);

  const value = useMemo<TrackContextValue>(() => ({
    focusedPlatformId: uiState.focusedPlatformId,
    focusedFigureName,
    expandedIds: uiState.expandedIds,
    focusRow,
    focusGroup,
    clearFocus,
    toggleRowExpansion,
    focusAndExpandRow,
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
    arenaHitRequest,
    queueArenaHit,
    clearAll,
  }), [
    arenaHitRequest,
    avoidance.error,
    avoidance.items,
    avoidance.loading,
    avoidance.totalAvoids,
    avoidance.weekOf,
    avoid,
    avoidForDate,
    clearAll,
    clearFocus,
    collapseOne,
    expandAll,
    focusAndExpandRow,
    focusedFigureName,
    focusGroup,
    focusRow,
    isDefeated,
    personWeeklyAvoids,
    platforms,
    queueArenaHit,
    todayActions,
    toggleRowExpansion,
    uiState.expandedIds,
    uiState.focusedPlatformId,
  ]);

  return <TrackCtx.Provider value={value}>{children}</TrackCtx.Provider>;
}
