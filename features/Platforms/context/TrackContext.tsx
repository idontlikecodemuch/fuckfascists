import React, {
  createContext,
  useCallback,
  useContext,
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
  selectedPlatformId: string | null;
  openPlatformId: string | null;
  arenaFocusKey: string | null;
  focusedFigureName: string | null;
  focusPlatform: (platformId: string) => void;
  openPlatformDetails: (platformId: string) => void;
  togglePlatformDetails: (platformId: string) => void;
  focusGroup: (figureName: string) => void;
  clearFocus: () => void;
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

/** Exported for dev-only harness mock injection. Production code uses useTrack(). */
export const TrackCtx = createContext<TrackContextValue | null>(null);

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

  const getFigureName = useCallback((platformId: string) => {
    const platform = platforms.find((item) => item.id === platformId);
    return platform ? getDisplayFigure(platform) : null;
  }, [platforms]);

  const focusPlatform = useCallback((platformId: string) => {
    const figureName = getFigureName(platformId);
    if (!figureName) return;
    dispatch({ type: 'focus-platform', platformId, figureName });
  }, [getFigureName]);

  const focusGroup = useCallback((figureName: string) => {
    dispatch({ type: 'focus-group', figureName });
  }, []);

  const clearFocus = useCallback(() => {
    dispatch({ type: 'clear-focus' });
  }, []);

  const openPlatformDetails = useCallback((platformId: string) => {
    const figureName = getFigureName(platformId);
    if (!figureName) return;
    dispatch({ type: 'open-platform-details', platformId, figureName });
  }, [getFigureName]);

  const togglePlatformDetails = useCallback((platformId: string) => {
    const figureName = getFigureName(platformId);
    if (!figureName) return;
    dispatch({ type: 'toggle-platform-details', platformId, figureName });
  }, [getFigureName]);

  const queueArenaHit = useCallback((figureName: string, delayMs = 0) => {
    setArenaHitRequest({
      id: Date.now() + Math.floor(Math.random() * 1000),
      figureName,
      delayMs,
    });
  }, []);

  // todayActions is derived data — useMemo prevents the useState+useEffect
  // pattern that caused an infinite loop: avoidance.items is now stable (memoized
  // in usePlatformAvoidance), so this only recomputes when events actually change.
  const sessionDateRef = useRef(getLocalDateString());
  const todayActions = useMemo(() => {
    const today = getLocalDateString();
    sessionDateRef.current = today;
    return buildTodayActions(avoidance.items, today, getDisplayFigure);
  }, [avoidance.items]);

  const avoid = useCallback(async (platformId: string) => {
    const recorded = await avoidance.avoid(platformId);
    return recorded;
  }, [avoidance]);

  const avoidForDate = useCallback(async (platformId: string, date: string) => {
    const recorded = await avoidance.avoidForDate(platformId, date);
    return recorded;
  }, [avoidance]);

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
    setArenaHitRequest(null);
    dispatch({ type: 'reset' });
  }, [avoidance]);

  const arenaFocusKey = useMemo(() => {
    return uiState.selectedPlatformId ?? uiState.focusedFigureName;
  }, [uiState.focusedFigureName, uiState.selectedPlatformId]);

  const value = useMemo<TrackContextValue>(() => ({
    selectedPlatformId: uiState.selectedPlatformId,
    openPlatformId: uiState.openPlatformId,
    arenaFocusKey,
    focusedFigureName: uiState.focusedFigureName,
    focusPlatform,
    openPlatformDetails,
    togglePlatformDetails,
    focusGroup,
    clearFocus,
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
    arenaFocusKey,
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
    focusPlatform,
    focusGroup,
    isDefeated,
    openPlatformDetails,
    personWeeklyAvoids,
    platforms,
    queueArenaHit,
    togglePlatformDetails,
    todayActions,
    uiState.focusedFigureName,
    uiState.openPlatformId,
    uiState.selectedPlatformId,
  ]);

  return <TrackCtx.Provider value={value}>{children}</TrackCtx.Provider>;
}
