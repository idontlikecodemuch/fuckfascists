import React, { useCallback } from 'react';
import type { FXEntry, FXRegistration, FXComponentProps } from './types';

interface FXLayerProps {
  entries: FXEntry[];
  registry: Record<string, FXRegistration>;
  reducedMotion: boolean;
  onComplete: (id: string) => void;
}

/**
 * Wraps an individual effect so the onComplete callback is stable across
 * FXLayer re-renders. Without this, inline `() => onComplete(entry.id)`
 * creates a new function each render, re-triggering useEffect in effects
 * that list onComplete as a dependency — causing an infinite loop.
 */
function FXEntryRenderer({ entry, Comp, reducedMotion, onComplete }: {
  entry: FXEntry;
  Comp: React.ComponentType<FXComponentProps>;
  reducedMotion: boolean;
  onComplete: (id: string) => void;
}) {
  const handleComplete = useCallback(() => onComplete(entry.id), [onComplete, entry.id]);
  return <Comp entry={entry} reducedMotion={reducedMotion} onComplete={handleComplete} />;
}

/**
 * Renders all active effects by looking up their type in the registry.
 * Mount this anywhere — MapScreen, future ArenaScreen, etc.
 * Unknown types are silently skipped (no crash on stale entries).
 */
export function FXLayer({ entries, registry, reducedMotion, onComplete }: FXLayerProps) {
  return (
    <>
      {entries.map((entry) => {
        const reg = registry[entry.type];
        if (!reg) return null;
        return <FXEntryRenderer key={entry.id} entry={entry} Comp={reg.component} reducedMotion={reducedMotion} onComplete={onComplete} />;
      })}
    </>
  );
}
