import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Entity } from '../../../core/models';
import type { StorageAdapter } from '../../../core/data';
import type { Platform } from '../../Platforms/types';
import type { ScorecardViewData } from '../types';
import { ScorecardImage } from '../components/ScorecardImage';
import { useCardCapture, type CardCaptureResult } from '../hooks/useCardCapture';
import { useDropSchedule } from '../hooks/useDropSchedule';
import { capturePendingScorecards, type DropAtForWeek } from '../data/pendingCaptures';

export interface ScorecardCaptureContextValue {
  /** True while a card is being rendered and saved. */
  capturing: boolean;
  /** True while a pending-week run is in progress. */
  running: boolean;
  /** When the most recent finished run started (ms), or null before the first. */
  lastRunStartedAt: number | null;
  /** Increments after a run captures or purges, so screens re-read cards and data. */
  cardsVersion: number;
  /** Captures (then purges) every pending week. A call during a run queues one more pass. */
  runPendingCaptures: () => Promise<void>;
  /** Renders and saves one card without purging. Used by dev "Generate now". */
  captureCard: (weekOf: string, data: ScorecardViewData) => Promise<CardCaptureResult | null>;
}

const ScorecardCaptureCtx = createContext<ScorecardCaptureContextValue | null>(null);

export function useScorecardCapture(): ScorecardCaptureContextValue {
  const ctx = useContext(ScorecardCaptureCtx);
  if (!ctx) throw new Error('useScorecardCapture must be used within ScorecardCaptureProvider');
  return ctx;
}

interface ScorecardCaptureProviderProps {
  adapter: StorageAdapter;
  entities: Entity[];
  platforms: Platform[];
  children: ReactNode;
  /** DEV-only drop resolver for the native release QA harness. */
  devDropAtForWeek?: DropAtForWeek;
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * App-shell host for the one scorecard capture path. Holds the off-screen
 * ScorecardImage and runs capturePendingScorecards when the shell asks (after
 * launch routing and on every resume) and when a drop passes while the app
 * stays open. Screens read capture state from useScorecardCapture().
 */
export function ScorecardCaptureProvider({
  adapter,
  entities,
  platforms,
  children,
  devDropAtForWeek,
}: ScorecardCaptureProviderProps) {
  const imageRef = useRef<View>(null);
  const { captureCard: captureView, capturing } = useCardCapture();
  const [target, setTarget] = useState<ScorecardViewData | null>(null);
  const [running, setRunning] = useState(false);
  const [lastRunStartedAt, setLastRunStartedAt] = useState<number | null>(null);
  const [cardsVersion, setCardsVersion] = useState(0);
  const runRef = useRef<Promise<void> | null>(null);
  const rerunRef = useRef(false);
  const startedRef = useRef(false);

  // Sync refs: these are read only inside async work, never rendered.
  const entitiesRef = useRef(entities);
  const platformsRef = useRef(platforms);
  const dropAtRef = useRef(devDropAtForWeek);
  entitiesRef.current = entities;
  platformsRef.current = platforms;
  dropAtRef.current = devDropAtForWeek;

  const captureCard = useCallback(async (weekOf: string, data: ScorecardViewData) => {
    setTarget(data);
    try {
      await nextFrame();
      return await captureView(imageRef, weekOf, data);
    } finally {
      setTarget(null);
    }
  }, [captureView]);

  const runPendingCaptures = useCallback((): Promise<void> => {
    startedRef.current = true;
    if (runRef.current) {
      // A request during a run (resume, drop passing) gets one more pass.
      rerunRef.current = true;
      return runRef.current;
    }

    setRunning(true);
    const run = (async () => {
      do {
        rerunRef.current = false;
        const startedAt = Date.now();
        try {
          const result = await capturePendingScorecards({
            adapter,
            entities: entitiesRef.current,
            platforms: platformsRef.current,
            captureWeek: async (weekOf, data) => (await captureCard(weekOf, data)) !== null,
            ...(dropAtRef.current ? { dropAtForWeek: dropAtRef.current } : {}),
          });
          if (result.captured.length > 0 || result.purged.length > 0) {
            setCardsVersion((version) => version + 1);
          }
        } catch {
          // Reading events failed. Nothing was deleted; the next launch or resume retries.
        }
        setLastRunStartedAt(startedAt);
      } while (rerunRef.current);
      runRef.current = null;
      setRunning(false);
    })();
    runRef.current = run;
    return run;
  }, [adapter, captureCard]);

  // A drop that passes while the app stays open. Waits until the shell has
  // started the cycle so cold-start routing is decided before any capture.
  const { hasDropped } = useDropSchedule();
  useEffect(() => {
    if (hasDropped && startedRef.current) void runPendingCaptures();
  }, [hasDropped, runPendingCaptures]);

  const value = useMemo<ScorecardCaptureContextValue>(() => ({
    capturing,
    running,
    lastRunStartedAt,
    cardsVersion,
    runPendingCaptures,
    captureCard,
  }), [capturing, running, lastRunStartedAt, cardsVersion, runPendingCaptures, captureCard]);

  return (
    <ScorecardCaptureCtx.Provider value={value}>
      {children}
      {/* Off-screen capture target. Kept opaque on purpose: on iOS, view-shot
          returns blank bitmaps when capturing through an opacity:0 ancestor. */}
      {target && (
        <View style={styles.offscreen} pointerEvents="none" collapsable={false}>
          <ScorecardImage key={target.weekOf} ref={imageRef} data={target} />
        </View>
      )}
    </ScorecardCaptureCtx.Provider>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: 'absolute',
    left: -10000,
    top: 0,
    zIndex: -1,
  },
});
