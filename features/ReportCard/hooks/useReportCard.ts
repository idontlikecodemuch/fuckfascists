import { useState, useEffect } from 'react';
import type { Entity } from '../../../core/models';
import type { StorageAdapter } from '../../../core/data';
import type { Platform } from '../../Survey/types';
import type { ReportCardData } from '../types';
import { generateReportCard } from '../utils/generateReportCard';

/**
 * Generates the report card for the given week on mount.
 * Re-runs whenever weekOf or isPreview changes.
 */
export function useReportCard(
  adapter: StorageAdapter,
  entities: Entity[],
  platforms: Platform[],
  weekOf: string,
  isPreview: boolean
): { data: ReportCardData | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData(null);
    setError(null);

    (async () => {
      try {
        const card = await generateReportCard(adapter, entities, platforms, weekOf, isPreview);
        if (cancelled) return;
        setData(card);
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        setError((err as Error).message);
      }
    })();

    return () => { cancelled = true; };
  }, [adapter, entities, platforms, weekOf, isPreview]);

  return { data, loading, error };
}
