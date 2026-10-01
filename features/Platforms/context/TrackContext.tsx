import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react';
import { AppState } from 'react-native';
import type { ReactNode } from 'react';
import type { StorageAdapter } from '../../../core/data';
import type { Platform, PlatformItem } from '../types';
import { usePlatformAvoidance } from '../hooks/usePlatformAvoidance';
import { getLocalDateString } from '../../../core/utils/localDate';
import type { ArenaHitRequest } from './trackHelpers';
import { buildTodayActions, isFigureDefeated, rollArenaDefeat } from './trackHelpers';
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
  unavoidForDate: (platformId: string, date: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  platforms: Platform[];
  personWeeklyAvoids: (figureName: string) => number;
  isDefeated: (figureName: string) => boolean;
  arenaHitRequest: ArenaHitRequest | null;
  queueArenaHit: (figureName: string, delayMs?: number, defeatChance?: number) => void;
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
  onAvoidRecorded?: () => void;
  children: ReactNode;
}

export function TrackProvider({ adapter, platforms, onAvoidRecorded, children }: TrackProviderProps) {
  const [uiState, dispatch] = useReducer(trackUIReducer, initialTrackUIState);
  const [arenaHitRequest, setArenaHitRequest] = useState<ArenaHitRequest | null>(null);
  const [defeatedFigures, setDefeatedFigures] = useState<Set<string>>(new Set());
  const [todayKey, setTodayKey] = useState(getLocalDateString);
  const avoidance = usePlatformAvoidance(adapter, platforms);

  useEffect(() => {
    const refreshToday = () => setTodayKey(getLocalDateString());
    const interval = setInterval(refreshToday, 60_000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshToday();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  // Defeats are visual game state, not reconstructed from recorded avoids.
  // Reset them when the local calendar day changes.
  useEffect(() => {
    setDefeatedFigures(new Set());
  }, [todayKey]);

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

  const queueArenaHit = useCallback((figureName: string, delayMs = 0, defeatChance?: number) => {
    setArenaHitRequest({
      id: Date.now() + Math.floor(Math.random() * 1000),
      figureName,
      delayMs,
    });

    if (rollArenaDefeat(Math.random, defeatChance)) {
      setDefeatedFigures((previous) => {
        if (previous.has(figureName)) return previous;
        const next = new Set(previous);
        next.add(figureName);
        return next;
      });
    }
  }, []);

  // todayActions remains useful for row state and list invalidation. It does not
  // drive sprite defeats; a recorded avoid and a visual hit are separate events.
  const todayActions = useMemo(() => {
    return buildTodayActions(avoidance.items, todayKey, getDisplayFigure);
  }, [avoidance.items, todayKey]);

  const avoid = useCallback(async (platformId: string) => {
    const recorded = await avoidance.avoid(platformId);
    if (recorded) onAvoidRecorded?.();
    return recorded;
  }, [avoidance, onAvoidRecorded]);

  const avoidForDate = useCallback(async (platformId: string, date: string) => {
    const recorded = await avoidance.avoidForDate(platformId, date);
    if (recorded) onAvoidRecorded?.();
    return recorded;
  }, [avoidance, onAvoidRecorded]);

  const unavoidForDate = useCallback(async (platformId: string, date: string) => {
    const removed = await avoidance.unavoidForDate(platformId, date);
    if (removed) onAvoidRecorded?.();
    return removed;
  }, [avoidance, onAvoidRecorded]);

  const personWeeklyAvoids = useCallback((figureName: string): number => {
    return avoidance.items
      .filter((item) => getDisplayFigure(item.platform) === figureName)
      .reduce((sum, item) => sum + item.weeklyCount, 0);
  }, [avoidance.items]);

  const isDefeated = useCallback((figureName: string): boolean => {
    return isFigureDefeated(figureName, defeatedFigures);
  }, [defeatedFigures]);

  const clearAll = useCallback(async () => {
    await avoidance.clearAll();
    setArenaHitRequest(null);
    setDefeatedFigures(new Set());
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
    unavoidForDate,
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
    unavoidForDate,
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
