import { useState, useCallback } from 'react';
import type { MatchingDeps } from '../../../core/matching';
import { matchEntity } from '../../../core/matching';
import type { ScanContext, ScanResult } from '../types';
import { buildScanResult } from '../utils/buildScanResult';

export type ScanStatus = 'idle' | 'scanning' | 'matched' | 'unmatched' | 'lookup_unavailable' | 'error';

export interface EntityScanState {
  status: ScanStatus;
  result: ScanResult | null;
  error: string | null;
  /** __DEV__-only diagnostic — propagated from matchEntity when lookup fails. */
  lookupReason: string | null;
}

const INITIAL: EntityScanState = { status: 'idle', result: null, error: null, lookupReason: null };

/**
 * Runs a business name through the entity matching pipeline.
 *
 * @param deps      Injected MatchingDeps — use makeCacheDeps(adapter) for cache.
 * @param areaHash  Rough-area token from useLocation — used for cache key only,
 *                  never as a coordinate.
 */
export function useEntityScan(deps: MatchingDeps, areaHash: string) {
  const [state, setState] = useState<EntityScanState>(INITIAL);

  const scanWithContext = useCallback(
    async (businessName: string, context: ScanContext | null = null) => {
      const trimmed = businessName.trim();
      if (!trimmed) return;

      setState({ status: 'scanning', result: null, error: null, lookupReason: null });

      try {
        // Barcode-derived scans skip the FEC fuzzy fallback. The brand
        // strings OFF returns (wine labels, product names, sub-brands)
        // rarely map cleanly to FEC committees, and anonymous FEC traffic
        // gets 403'd on most networks. Better to surface a clean "Found
        // X — coverage growing" no-match toast than chase a doomed FEC call.
        const allowFecFallback = context?.kind !== 'barcode';
        const matchResult = await matchEntity(
          trimmed,
          deps,
          areaHash,
          undefined,
          { allowFecFallback },
        );

        if (!matchResult.matched) {
          const status = matchResult.lookupStatus === 'lookup_unavailable'
            ? 'lookup_unavailable'
            : 'unmatched';
          setState({
            status,
            result: null,
            error: null,
            lookupReason: matchResult.lookupReason ?? null,
          });
          return;
        }

        setState({
          status: 'matched',
          result: buildScanResult(matchResult, context),
          error: null,
          lookupReason: null,
        });
      } catch (err) {
        // DIAGNOSTIC — remove before ship
        console.error('[useEntityScan] matchEntity threw:', err);
        setState({
          status: 'error',
          result: null,
          error: (err as Error).message,
          lookupReason: null,
        });
      }
    },
    [deps, areaHash]
  );

  const reset = useCallback(() => setState(INITIAL), []);

  return { ...state, scan: scanWithContext, reset };
}
