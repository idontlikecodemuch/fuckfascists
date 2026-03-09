import { useState, useCallback } from 'react';
import type { MatchingDeps } from '../../../core/matching';
import { matchEntity } from '../../../core/matching';
import type { ScanResult } from '../types';
import { buildScanResult } from '../utils/buildScanResult';

export type ScanStatus = 'idle' | 'scanning' | 'matched' | 'unmatched' | 'error';

export interface EntityScanState {
  status: ScanStatus;
  result: ScanResult | null;
  error: string | null;
}

const INITIAL: EntityScanState = { status: 'idle', result: null, error: null };

/**
 * Runs a business name through the entity matching pipeline.
 *
 * @param deps      Injected MatchingDeps — use makeCacheDeps(adapter) for cache.
 * @param areaHash  Rough-area token from useLocation — used for cache key only,
 *                  never as a coordinate.
 */
export function useEntityScan(deps: MatchingDeps, areaHash: string) {
  const [state, setState] = useState<EntityScanState>(INITIAL);

  const scan = useCallback(
    async (businessName: string) => {
      const trimmed = businessName.trim();
      if (!trimmed) return;

      setState({ status: 'scanning', result: null, error: null });

      try {
        const matchResult = await matchEntity(trimmed, deps, areaHash);

        if (!matchResult.matched) {
          setState({ status: 'unmatched', result: null, error: null });
          return;
        }

        setState({
          status: 'matched',
          result: buildScanResult(matchResult),
          error: null,
        });
      } catch (err) {
        // DIAGNOSTIC — remove before ship
        console.error('[useEntityScan] matchEntity threw:', err);
        setState({
          status: 'error',
          result: null,
          error: (err as Error).message,
        });
      }
    },
    [deps, areaHash]
  );

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, scan, reset };
}
