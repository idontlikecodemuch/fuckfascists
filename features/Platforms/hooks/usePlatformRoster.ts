import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_SELECTED_PLATFORM_IDS } from '../data/platformList';

const ROSTER_KEY = 'platform_roster';

export interface PlatformRosterState {
  /** null while loading from SecureStore; string[] once resolved; undefined if no selection made yet. */
  selectedIds: string[] | null | undefined;
  /** Persists the user's platform selection. */
  saveSelection: (ids: string[]) => Promise<void>;
}

/**
 * Persists the user's platform roster selection in SecureStore.
 *
 * - `null` = still loading from SecureStore
 * - `undefined` = no selection has been made (show setup screen)
 * - `string[]` = user's saved selection
 *
 * No personal data is stored — just a JSON array of platform IDs.
 */
export function usePlatformRoster(): PlatformRosterState {
  const [selectedIds, setSelectedIds] = useState<string[] | null | undefined>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(ROSTER_KEY);
        if (cancelled) return;
        if (raw === null) {
          setSelectedIds(undefined); // no selection yet → show setup
        } else {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.every((v) => typeof v === 'string')) {
            setSelectedIds(parsed as string[]);
          } else {
            setSelectedIds(undefined);
          }
        }
      } catch {
        if (!cancelled) setSelectedIds(undefined);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveSelection = useCallback(async (ids: string[]) => {
    await SecureStore.setItemAsync(ROSTER_KEY, JSON.stringify(ids));
    setSelectedIds(ids);
  }, []);

  return { selectedIds, saveSelection };
}

/** Returns the default pre-checked platform IDs for the setup screen. */
export function getDefaultSelectedIds(): string[] {
  return [...DEFAULT_SELECTED_PLATFORM_IDS];
}
