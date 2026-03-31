import { useState, useEffect, useRef } from 'react';
import type { Entity } from '../../../core/models';
import type { StorageAdapter } from '../../../core/data';
import type { Platform } from '../../Platforms/types';
import type { ScorecardViewData } from '../types';
import { aggregateScorecard } from '../data/aggregateScorecard';

/**
 * Aggregates the week's avoidance events into person-grouped scorecard data.
 * Re-runs whenever weekOf or isPreview changes.
 */
export function useScorecard(
  adapter: StorageAdapter,
  entities: Entity[],
  platforms: Platform[],
  weekOf: string,
  isPreview: boolean,
): { data: ScorecardViewData | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<ScorecardViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs keep entities/platforms current without listing them as effect deps.
  // They are stable for the session (loaded once in App.tsx) but using refs
  // prevents a spurious aggregateScorecard re-run if the array reference ever
  // changes without the content changing (e.g. a parent re-render).
  const entitiesRef = useRef(entities);
  const platformsRef = useRef(platforms);
  entitiesRef.current = entities;
  platformsRef.current = platforms;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setError(null);

    (async () => {
      try {
        const persons = await aggregateScorecard(adapter, entitiesRef.current, platformsRef.current, weekOf);
        if (cancelled) return;
        const grandTotal = persons.reduce((sum, p) => sum + p.totalCount, 0);
        setData({ weekOf, persons, grandTotal, isPreview });
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        setError((err as Error).message);
      }
    })();

    return () => { cancelled = true; };
  }, [adapter, weekOf, isPreview]);

  return { data, loading, error };
}
