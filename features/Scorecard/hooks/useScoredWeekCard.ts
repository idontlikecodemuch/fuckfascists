import { useEffect, useState } from 'react';
import { findCardForWeek } from '../data/cardArchive';

interface CardLookup {
  key: string;
  weekOf: string;
  uri: string | null;
}

/**
 * The archived card for one scored week (exact filename match), re-read
 * whenever refreshKey changes. Pass null to skip the lookup (before the drop).
 */
export function useScoredWeekCard(
  weekOf: string | null,
  refreshKey: number,
): { uri: string | null; loading: boolean } {
  const [lookup, setLookup] = useState<CardLookup | null>(null);
  const key = weekOf ? `${weekOf}:${refreshKey}` : null;

  useEffect(() => {
    if (!weekOf) return undefined;
    let cancelled = false;
    (async () => {
      const card = await findCardForWeek(weekOf);
      if (!cancelled) setLookup({ key: `${weekOf}:${refreshKey}`, weekOf, uri: card?.uri ?? null });
    })();
    return () => { cancelled = true; };
  }, [weekOf, refreshKey]);

  if (!weekOf) return { uri: null, loading: false };
  return {
    uri: lookup?.weekOf === weekOf ? lookup.uri : null,
    loading: lookup?.key !== key,
  };
}
