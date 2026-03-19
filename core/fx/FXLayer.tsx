import React from 'react';
import type { FXEntry, FXRegistration } from './types';

interface FXLayerProps {
  entries: FXEntry[];
  registry: Record<string, FXRegistration>;
  reducedMotion: boolean;
  onComplete: (id: string) => void;
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
        const Comp = reg.component;
        return <Comp key={entry.id} entry={entry} reducedMotion={reducedMotion} onComplete={() => onComplete(entry.id)} />;
      })}
    </>
  );
}
