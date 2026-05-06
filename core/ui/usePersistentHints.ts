import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export interface PersistentHintDefinition<HintId extends string> {
  id: HintId;
  version?: string;
}

interface PersistentHintsState<HintId extends string> {
  activeHint: HintId | null;
  activeIndex: number;
  totalHints: number;
  loading: boolean;
  dismiss: (id: HintId) => Promise<void>;
}

type StoredHints = Record<string, string>;

const DEFAULT_HINT_VERSION = 'v1';

function hintVersion<HintId extends string>(
  hints: readonly PersistentHintDefinition<HintId>[],
  id: HintId,
): string {
  return hints.find((hint) => hint.id === id)?.version ?? DEFAULT_HINT_VERSION;
}

function parseStoredHints(value: string | null): StoredHints {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return Object.fromEntries(
        parsed
          .filter((id): id is string => typeof id === 'string')
          .map((id) => [id, DEFAULT_HINT_VERSION]),
      );
    }
    if (parsed && typeof parsed === 'object') {
      return parsed as StoredHints;
    }
  } catch {
    // Treat malformed hint state as no hints seen.
  }

  return {};
}

export function usePersistentHints<HintId extends string>({
  storageKey,
  hints,
}: {
  storageKey: string;
  hints: readonly PersistentHintDefinition<HintId>[];
}): PersistentHintsState<HintId> {
  const [seenVersions, setSeenVersions] = useState<StoredHints>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    SecureStore.getItemAsync(storageKey)
      .then((value) => {
        if (cancelled) return;
        setSeenVersions(parseStoredHints(value));
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const dismiss = useCallback(async (id: HintId) => {
    setSeenVersions((prev) => {
      const next = { ...prev, [id]: hintVersion(hints, id) };
      SecureStore.setItemAsync(storageKey, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, [hints, storageKey]);

  const activeHint = loading
    ? null
    : hints.find((hint) => seenVersions[hint.id] !== (hint.version ?? DEFAULT_HINT_VERSION))?.id ?? null;
  const activeIndex = activeHint ? hints.findIndex((hint) => hint.id === activeHint) : -1;

  return { activeHint, activeIndex, totalHints: hints.length, loading, dismiss };
}
