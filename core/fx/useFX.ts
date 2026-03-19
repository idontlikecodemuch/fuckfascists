import { useState, useCallback, useEffect, useRef } from 'react';
import { AccessibilityInfo } from 'react-native';
import type { FXEntry, FXScope } from './types';

/** State + dispatch returned by useFX. */
export interface FXState {
  entries: FXEntry[];
  /** True when at least one effect is active. */
  active: boolean;
  /** Fire an effect by type. Returns the generated entry id. */
  fire: (type: string, scope: FXScope, meta?: Record<string, unknown>) => string;
  /** Remove a completed effect by id. */
  remove: (id: string) => void;
  /** Whether the OS has reduced-motion enabled. */
  reducedMotion: boolean;
}

/**
 * Manages a list of active effects.
 * Fire-and-forget: callers call `fire()`, effects auto-remove via `onComplete`.
 */
export function useFX(): FXState {
  const [entries, setEntries] = useState<FXEntry[]>([]);
  const reducedMotionRef = useRef(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!cancelled) {
        reducedMotionRef.current = v;
        setReducedMotion(v);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const fire = useCallback((type: string, scope: FXScope, meta?: Record<string, unknown>): string => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const entry: FXEntry = { id, type, scope, startedAt: Date.now(), meta };
    setEntries((prev) => [...prev, entry]);
    return id;
  }, []);

  const remove = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, active: entries.length > 0, fire, remove, reducedMotion };
}
