import React, { useCallback, useRef, useState } from 'react';
import type { MatchingDeps } from '../../../core/matching';
import { matchEntity } from '../../../core/matching';
import { buildScanResult } from '../utils/buildScanResult';
import { MapKitSearch } from '../nativeModules/MapKitSearch';
import type { MapPin } from '../types';
import {
  POI_SEARCH_RADIUS_METERS,
  POI_SEARCH_RADIUS_MIN_METERS,
  POI_SEARCH_RADIUS_MAX_METERS,
  TAP_CACHE_TTL_MS,
  TAP_DEBOUNCE_MS,
} from '../../../config/constants';
import type { Region } from 'react-native-maps';

export interface LatLng {
  latitude: number;
  longitude: number;
}

// Minimal shape of the react-native-maps onPoiClick event we consume.
export interface PoiClickEvent {
  nativeEvent: {
    name: string;
    coordinate: LatLng;
    placeId: string;
  };
}

interface CellCacheEntry {
  names: string[];
  expiresAt: number;
}

/**
 * Rounds to 3 decimal places (~111m grid) for tap cell cache keys.
 * Finer than toAreaHash (~1.1km) — ensures nearby taps reuse cached POI names
 * without pulling in results from an entire city block away.
 * The key is a plain string, never stored as coordinates.
 */
function tapCellKey(lat: number, lng: number): string {
  const r = (n: number) => Math.round(n * 1000) / 1000;
  return `${r(lat)},${r(lng)}`;
}

// V2: When more than 5 POI matches are returned from a single tap, show a
// scrollable bottom-sheet chooser instead of (or in addition to) stacked
// markers. For MVP, all matches render as markers regardless of count.

/**
 * Computes a POI search radius proportional to the visible map region.
 * ~5% of the shorter span dimension (converted to meters), clamped to
 * POI_SEARCH_RADIUS_MIN_METERS..POI_SEARCH_RADIUS_MAX_METERS.
 * Falls back to POI_SEARCH_RADIUS_METERS when region is unavailable.
 *
 * 1° latitude ≈ 111,320m everywhere.
 * 1° longitude ≈ 111,320m × cos(latitude).
 */
function computeSearchRadius(region: Region | null): number {
  if (!region) return POI_SEARCH_RADIUS_METERS;
  const latMeters = region.latitudeDelta * 111_320;
  const lngMeters = region.longitudeDelta * 111_320 * Math.cos((region.latitude * Math.PI) / 180);
  const shorterSpan = Math.min(latMeters, lngMeters);
  const radius = shorterSpan * 0.05;
  return Math.max(POI_SEARCH_RADIUS_MIN_METERS, Math.min(POI_SEARCH_RADIUS_MAX_METERS, radius));
}

/**
 * Handles iOS (onPress → MKLocalPointsOfInterestRequest) and Android
 * (onPoiClick → nativeEvent.name) tap-to-match flows.
 *
 * Privacy invariants:
 *   - Tap coordinates are used only to call searchNearby and derive a cell
 *     cache key. They are never written to disk, never transmitted.
 *   - Cache key is a rounded string, not precise coordinates.
 *   - MapKitSearch does not access device GPS. Coordinate comes from the tap event.
 */
export function useTapSearch(deps: MatchingDeps, areaHash: string, regionRef?: React.RefObject<Region>) {
  const [tapPins, setTapPins] = useState<MapPin[]>([]);
  const [tapLoadingCoord, setTapLoadingCoord] = useState<LatLng | null>(null);
  const cellCache = useRef<Map<string, CellCacheEntry>>(new Map());
  const lastTapAt = useRef<number>(0);

  /**
   * Runs each POI name through matchEntity and adds matched pins at coordinate.
   * Uses Promise.allSettled so one failing name doesn't block the others.
   */
  const processTapNames = useCallback(
    async (names: string[], coordinate: LatLng) => {
      const results = await Promise.allSettled(
        names.map((name) => matchEntity(name, deps, areaHash))
      );

      const newPins: MapPin[] = [];
      for (const r of results) {
        if (r.status !== 'fulfilled' || !r.value.matched) continue;
        const scanResult = buildScanResult(r.value);
        const id = scanResult.entityId ?? scanResult.fecCommitteeId;
        // Guard: empty/falsy id causes a nil key on FlagMarker, crashing AIRMap.
        if (!id) continue;
        newPins.push({
          id,
          name: scanResult.canonicalName,
          coords: coordinate, // session-only — never persisted
          result: scanResult,
          avoided: false,
        });
      }

      if (newPins.length > 0) {
        setTapPins((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const deduped = newPins.filter((p) => !existingIds.has(p.id));
          return [...prev, ...deduped];
        });
      }
    },
    [deps, areaHash]
  );

  /**
   * iOS onPress handler.
   * Calls MKLocalPointsOfInterestRequest via the native MapKitSearch module.
   * Returns immediately (no loading state) when the module is not yet linked.
   */
  const handleMapPress = useCallback(
    async (e: { nativeEvent: { coordinate: LatLng } }) => {
      const now = Date.now();
      if (now - lastTapAt.current < TAP_DEBOUNCE_MS) return;
      lastTapAt.current = now;

      const { coordinate } = e.nativeEvent;
      setTapLoadingCoord(coordinate);

      try {
        const cellKey = tapCellKey(coordinate.latitude, coordinate.longitude);
        const cached = cellCache.current.get(cellKey);

        if (cached && cached.expiresAt > Date.now()) {
          console.log('[useTapSearch] cache hit for cell', cellKey);
          await processTapNames(cached.names, coordinate);
          return;
        }

        const radius = computeSearchRadius(regionRef?.current ?? null);
        const names = await MapKitSearch.searchNearby(
          coordinate.latitude,
          coordinate.longitude,
          radius
        );

        cellCache.current.set(cellKey, { names, expiresAt: Date.now() + TAP_CACHE_TTL_MS });
        await processTapNames(names, coordinate);
      } catch (err) {
        // Fail silently — no user-visible error for tap search failures.
        console.error('[useTapSearch] handleMapPress error:', err);
      } finally {
        setTapLoadingCoord(null);
      }
    },
    [processTapNames]
  );

  /**
   * Android onPoiClick handler.
   * Name comes directly from e.nativeEvent — no native search call needed.
   * Access via e.nativeEvent.name, NOT e.name (e returns undefined directly).
   */
  const handlePoiClick = useCallback(
    async (e: PoiClickEvent) => {
      const { name, coordinate } = e.nativeEvent;
      setTapLoadingCoord(coordinate);
      try {
        await processTapNames([name], coordinate);
      } catch (err) {
        console.error('[useTapSearch] handlePoiClick error:', err);
      } finally {
        setTapLoadingCoord(null);
      }
    },
    [processTapNames]
  );

  const resetTapPins = useCallback(() => setTapPins([]), []);

  const markTapPinAvoided = useCallback((entityId: string) => {
    setTapPins((prev) =>
      prev.map((p) => (p.id === entityId ? { ...p, avoided: true } : p))
    );
  }, []);

  return { tapPins, tapLoadingCoord, handleMapPress, handlePoiClick, resetTapPins, markTapPinAvoided };
}
