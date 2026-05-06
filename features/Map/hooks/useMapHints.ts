import { usePersistentHints } from '../../../core/ui/usePersistentHints';

const HINTS_KEY = 'map_hints_dismissed';

const HINTS = [
  { id: 'search', version: 'v1' },
  { id: 'tap', version: 'v1' },
  { id: 'barcode', version: 'v1' },
] as const;
export type HintId = (typeof HINTS)[number]['id'];

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
  return usePersistentHints<HintId>({ storageKey: HINTS_KEY, hints: HINTS });
}
