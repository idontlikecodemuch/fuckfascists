import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const HINTS_KEY = 'map_hints_dismissed';

/** Ordered hint IDs — shown one at a time in this sequence. */
const HINT_IDS = ['search', 'tap', 'barcode'] as const;
export type HintId = (typeof HINT_IDS)[number];

interface MapHintsState {
  /** The currently active hint to display, or null if all dismissed. */
  activeHint: HintId | null;
  /** Zero-based index of the active hint within the sequence, or -1 if none. */
  activeIndex: number;
  /** Total number of hints in the sequence. */
  totalHints: number;
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
  const activeIndex = activeHint ? HINT_IDS.indexOf(activeHint) : -1;

  return { activeHint, activeIndex, totalHints: HINT_IDS.length, loading, dismiss };
}
