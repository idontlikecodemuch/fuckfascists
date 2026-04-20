import { useCallback, useRef, useState } from 'react';
import type { BarcodeScanningResult } from 'expo-camera';
import type { Entity } from '../../../core/models';
import { getCachedBarcodeLookup, setCachedBarcodeLookup } from '../barcode/barcodeCacheStore';
import { lookupBarcodeViaOpenFoodFacts } from '../barcode/openFoodFacts';
import { normalizeBarcode } from '../barcode/normalizeBarcode';
import { findBundledProductByBarcode } from '../barcode/productIndex';
import type { ScanContext } from '../types';
import { mapCopy } from '../../../copy/map';

export interface BarcodeNotice {
  kind: 'unsupported' | 'no_match' | 'not_in_database' | 'lookup_unavailable';
  label: string;
}

export interface BarcodeSearchTarget {
  searchTerm: string;
  context: Extract<ScanContext, { kind: 'barcode' }>;
}

/**
 * Barcode flow:
 *   1. Normalize UPC/EAN into GTIN-13
 *   2. Check bundled exact-product and producer-prefix index (instant, no network)
 *   3. Check persistent on-device cache
 *   4. Resolve brand via Open Food Facts on cache miss
 *   5. Match that brand into the bundled entity alias graph
 */
export function useBarcodeSearch(entities: Entity[]) {
  const [isResolving, setIsResolving] = useState(false);
  const [notice, setNotice] = useState<BarcodeNotice | null>(null);

  // Ref keeps entities current without making resolveBarcode unstable.
  // resolveBarcode is called on demand (never a useEffect dep), so recreating
  // it on every entities reference change is unnecessary churn.
  const entitiesRef = useRef(entities);
  entitiesRef.current = entities;

  const clearNotice = useCallback(() => setNotice(null), []);

  const resolveBarcode = useCallback(
    async (scanResult: Pick<BarcodeScanningResult, 'data' | 'type'>): Promise<BarcodeSearchTarget | null> => {
      const normalized = normalizeBarcode(scanResult.data, scanResult.type);
      if (!normalized) {
        setNotice({
          kind: 'unsupported',
          label: scanResult.data.trim() || mapCopy.barcodeFallbackLabel,
        });
        return null;
      }

      // Fast path: bundled exact-product / producer-prefix index (instant, no cache or network)
      const bundledMatch = findBundledProductByBarcode(normalized, entitiesRef.current);
      if (bundledMatch) {
        return {
          searchTerm: bundledMatch.searchTerm,
          context: {
            kind: 'barcode',
            barcode: normalized.displayCode,
            productName: bundledMatch.source === 'bundled_product' ? bundledMatch.productName : null,
            brandName:
              bundledMatch.source === 'bundled_product'
                ? bundledMatch.brandName
                : bundledMatch.entity.aliases[0] ?? bundledMatch.entity.canonicalName,
            source: bundledMatch.source,
          },
        };
      }

      setIsResolving(true);
      setNotice(null);

      try {
        const cached = await getCachedBarcodeLookup(normalized.gtin13);

        if (cached) {
          if (cached.status === 'matched' && cached.searchTerm) {
            return {
              searchTerm: cached.searchTerm,
              context: {
                kind: 'barcode',
                barcode: normalized.displayCode,
                productName: cached.productName,
                brandName: cached.brandName,
                source: 'cache',
              },
            };
          }

          setNotice({
            kind: 'no_match',
            label: cached.productName ?? cached.brandName ?? normalized.displayCode,
          });
          return null;
        }

        const live = await lookupBarcodeViaOpenFoodFacts(normalized, entitiesRef.current);
        if (live.kind === 'matched') {
          await setCachedBarcodeLookup({
            barcode: normalized.gtin13,
            searchTerm: live.target.searchTerm,
            productName: live.target.productName,
            brandName: live.target.brandName,
            source: 'open_food_facts',
            status: 'matched',
            fetchedAt: Date.now(),
          });

          return {
            searchTerm: live.target.searchTerm,
            context: {
              kind: 'barcode',
              barcode: live.target.barcode,
              productName: live.target.productName,
              brandName: live.target.brandName,
              source: 'open_food_facts',
            },
          };
        }

        if (live.kind === 'not_in_database') {
          await setCachedBarcodeLookup({
            barcode: normalized.gtin13,
            searchTerm: null,
            productName: null,
            brandName: null,
            source: 'open_food_facts',
            status: 'no_match',
            fetchedAt: Date.now(),
          });

          setNotice({
            kind: 'not_in_database',
            label: live.barcode,
          });
          return null;
        }

        if (live.kind === 'no_match') {
          await setCachedBarcodeLookup({
            barcode: normalized.gtin13,
            searchTerm: null,
            productName: live.productName,
            brandName: live.brandName,
            source: 'open_food_facts',
            status: 'no_match',
            fetchedAt: Date.now(),
          });

          setNotice({
            kind: 'no_match',
            label: live.productName ?? live.brandName ?? live.barcode,
          });
          return null;
        }

        setNotice({
          kind: 'lookup_unavailable',
          label: live.barcode,
        });
        return null;
      } finally {
        setIsResolving(false);
      }
    },
    []
  );

  return {
    isResolving,
    notice,
    resolveBarcode,
    clearNotice,
  };
}
