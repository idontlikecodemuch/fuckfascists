import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const HINTS_KEY = 'map_hints_dismissed';

/** Ordered hint IDs — shown one at a time in this sequence. */
const HINT_IDS = ['search', 'tap', 'barcode'] as const;
export type HintId = (typeof HINT_IDS)[number];

interface MapHintsState {
  /** The currently active hint to display, or null if all dismissed. */
  activeHint: HintId | null;
  /** Whether the hook is still loading from SecureStore. */
  loading: boolean;
  /** Dismiss the specified hint permanently. */
  dismiss: (id: HintId) => Promise<void>;
}

/**
 * Manages first-use map hints with SecureStore persistence.
 * Shows hints one at a time in order: search → tap → barcode.
 * Each hint is dismissed independently and permanently.
 */
export function useMapHints(): MapHintsState {
  const [dismissed, setDismissed] = useState<Set<HintId>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(HINTS_KEY)
      .then((val) => {
        if (cancelled) return;
        if (val) {
          const ids = JSON.parse(val) as HintId[];
          setDismissed(new Set(ids));
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const dismiss = useCallback(async (id: HintId) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      const arr = Array.from(next);
      SecureStore.setItemAsync(HINTS_KEY, JSON.stringify(arr)).catch(() => {});
      return next;
    });
  }, []);

  const activeHint = loading ? null : HINT_IDS.find((id) => !dismissed.has(id)) ?? null;

  return { activeHint, loading, dismiss };
}
