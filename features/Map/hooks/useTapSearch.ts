import React, { useCallback, useRef, useState } from 'react';
import type { MatchingDeps } from '../../../core/matching';
import { matchEntity } from '../../../core/matching';
import { buildScanResult } from '../utils/buildScanResult';
import { MapKitSearch } from '../nativeModules/MapKitSearch';
import type { MapPin, ScanResult } from '../types';
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
 * Rounds to 4 decimal places (~11m grid) for tap cell cache keys.
 * Matches the tightened POI search radius (15m min) so taps on opposite
 * sides of a street get different cache entries.
 * Includes radius so a zoom change at the same location triggers a fresh search.
 * The key is a plain string, never stored as coordinates.
 */
function tapCellKey(lat: number, lng: number, radius: number): string {
  const r = (n: number) => Math.round(n * 10000) / 10000;
  return `${r(lat)},${r(lng)},${Math.round(radius)}`;
}

// When a tap produces 2+ matches, MapScreen shows a MatchChooser overlay.
// All matches also render as markers for visual context.

/**
 * Computes a POI search radius proportional to the visible map region.
 * ~2% of the shorter span dimension (converted to meters), clamped to
 * POI_SEARCH_RADIUS_MIN_METERS..POI_SEARCH_RADIUS_MAX_METERS.
 * Falls back to POI_SEARCH_RADIUS_METERS when region is unavailable.
 *
 * 1° latitude ≈ 111,320m everywhere.
 * 1° longitude ≈ 111,320m × cos(latitude).
 */
function computeSearchRadius(region: Region | null): number {
  if (!region) return POI_SEARCH_RADIUS_METERS;
  const latMeters = region.latitudeDelta * 111_320;
  const lngMeters =
    region.longitudeDelta * 111_320 * Math.cos((region.latitude * Math.PI) / 180);
  const shorterSpan = Math.min(latMeters, lngMeters);
  const radius = shorterSpan * 0.02;
  return Math.max(
    POI_SEARCH_RADIUS_MIN_METERS,
    Math.min(POI_SEARCH_RADIUS_MAX_METERS, radius),
  );
}

/** Coordinate key for deduplicating ghost markers (~11m grid). */
function ghostKey(coord: LatLng): string {
  const r = (n: number) => Math.round(n * 10000) / 10000;
  return `${r(coord.latitude)},${r(coord.longitude)}`;
}

/**
 * Maximum ghost markers before we stop adding new ones.
 * Ghost markers are append-only — never removed during the session.
 * This prevents the AIRMap insertReactSubview nil crash on Fabric
 * that occurs when Markers are added and removed in the same render.
 */
const MAX_GHOST_MARKERS = 30;

const TAP_NO_MATCH_DISPLAY_MS = 2000;

/**
 * Handles iOS (onPress → MKLocalPointsOfInterestRequest) and Android
 * (onPoiClick → nativeEvent.name) tap-to-match flows.
 *
 * Privacy invariants:
 *   - Tap coordinates are used only to call searchNearby and derive a cell
 *     cache key. They are never written to disk, never transmitted.
 *   - Cache key is a rounded string, not precise coordinates.
 *   - MapKitSearch does not access device GPS. Coordinate comes from the tap event.
 *
 * Crash prevention — append-only Markers:
 *   All map Markers managed by this hook are append-only during the session.
 *   No Marker is ever removed from the MapView until the component unmounts.
 *   This eliminates the AIRMap insertReactSubview nil crash on Fabric
 *   (react-native-maps #5345, #5217) caused by simultaneous add+remove
 *   in the same React render cycle.
 *
 *   - FlagMarkers (tapPins): only added, never removed.
 *   - Ghost markers (tapNoMatchCoords): only added, capped without rotation.
 *   - Loading indicator: NOT a Marker — no native map subview involved.
 *   - processTapNames serialized via inFlightRef (one at a time).
 */
export function useTapSearch(
  deps: MatchingDeps,
  areaHash: string,
  regionRef?: React.RefObject<Region>,
  avoidedTodayRef?: React.RefObject<Set<string>>,
) {
  const [tapPins, setTapPins] = useState<MapPin[]>([]);
  /** Scan results from the most recent tap — drives the MatchChooser when length ≥ 2. */
  const [latestTapBatch, setLatestTapBatch] = useState<ScanResult[]>([]);
  /** True briefly after a tap search yields no matches — drives the no-match toast. */
  const [tapNoMatch, setTapNoMatch] = useState(false);
  /** No-match tap coordinates — ghost flags persist until tab switch / unmount. */
  const [tapNoMatchCoords, setTapNoMatchCoords] = useState<LatLng[]>([]);
  /** True while a POI search is in-flight — drives non-Marker loading UI. */
  const [tapSearching, setTapSearching] = useState(false);
  const tapNoMatchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cellCache = useRef<Map<string, CellCacheEntry>>(new Map());
  const lastTapAt = useRef<number>(0);
  /** Serialization guard — prevents concurrent processTapNames execution. */
  const inFlightRef = useRef(false);
  /** Track ghost marker keys to deduplicate same-location taps. */
  const ghostKeysRef = useRef(new Set<string>());

  /**
   * Runs each POI name through matchEntity and adds matched pins at coordinate.
   * Uses Promise.allSettled so one failing name doesn't block the others.
   * Serialized — if a previous call is in-flight, this one is dropped.
   */
  const processTapNames = useCallback(
    async (names: string[], coordinate: LatLng, suppressNoMatch = false) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      try {
        const results = await Promise.allSettled(
          names.map((name) => matchEntity(name, deps, areaHash)),
        );

        const newPins: MapPin[] = [];
        const batchResults: ScanResult[] = [];
        const seenIds = new Set<string>();
        for (const r of results) {
          if (r.status !== 'fulfilled' || !r.value.matched) continue;
          const scanResult = buildScanResult(r.value);
          const id = scanResult.entityId ?? scanResult.fecCommitteeId;
          if (!id) continue;
          if (seenIds.has(id)) continue;
          seenIds.add(id);
          batchResults.push(scanResult);
          newPins.push({
            id,
            name: scanResult.matchedAlias || scanResult.canonicalName,
            coords: coordinate,
            result: scanResult,
            avoided: avoidedTodayRef?.current?.has(id) ?? false,
          });
        }

        setLatestTapBatch(batchResults);

        // Ghost marker: show when tap found POI names but none matched.
        // Append-only — once cap is reached, no new ghosts are added.
        // Deduplicate by rounded coordinate key.
        // Suppressed on auto-scan to avoid noisy first-load UI.
        if (batchResults.length === 0 && names.length > 0 && !suppressNoMatch) {
          if (tapNoMatchTimer.current) clearTimeout(tapNoMatchTimer.current);
          setTapNoMatch(true);

          const key = ghostKey(coordinate);
          if (!ghostKeysRef.current.has(key)) {
            ghostKeysRef.current.add(key);
            setTapNoMatchCoords((prev) => {
              // Cap reached — stop adding, never remove.
              if (prev.length >= MAX_GHOST_MARKERS) return prev;
              return [...prev, coordinate];
            });
          }

          tapNoMatchTimer.current = setTimeout(() => {
            setTapNoMatch(false);
          }, TAP_NO_MATCH_DISPLAY_MS);
        } else if (!suppressNoMatch) {
          setTapNoMatch(false);
        }

        if (newPins.length > 0) {
          setTapPins((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const deduped = newPins.filter((p) => !existingIds.has(p.id));
            return [...prev, ...deduped];
          });
        }
      } finally {
        inFlightRef.current = false;
        setTapSearching(false);
      }
    },
    [deps, areaHash],
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

      // Drop tap if a previous search is still in-flight.
      if (inFlightRef.current) return;

      setTapSearching(true);

      const { coordinate } = e.nativeEvent;

      try {
        const radius = computeSearchRadius(regionRef?.current ?? null);
        const cellKey = tapCellKey(
          coordinate.latitude,
          coordinate.longitude,
          radius,
        );
        const cached = cellCache.current.get(cellKey);

        if (cached && cached.expiresAt > Date.now()) {
          await processTapNames(cached.names, coordinate);
          return;
        }
        const names = await MapKitSearch.searchNearby(
          coordinate.latitude,
          coordinate.longitude,
          radius,
        );

        cellCache.current.set(cellKey, {
          names,
          expiresAt: Date.now() + TAP_CACHE_TTL_MS,
        });
        await processTapNames(names, coordinate);
      } catch (err) {
        // Fail silently — no user-visible error for tap search failures.
        console.error('[useTapSearch] handleMapPress error:', err);
        setTapSearching(false);
      }
    },
    [processTapNames],
  );

  /**
   * Android onPoiClick handler.
   * Name comes directly from e.nativeEvent — no native search call needed.
   * Access via e.nativeEvent.name, NOT e.name (e returns undefined directly).
   */
  const handlePoiClick = useCallback(
    async (e: PoiClickEvent) => {
      if (inFlightRef.current) return;
      const { name, coordinate } = e.nativeEvent;
      setTapSearching(true);
      try {
        await processTapNames([name], coordinate);
      } catch (err) {
        console.error('[useTapSearch] handlePoiClick error:', err);
        setTapSearching(false);
      }
    },
    [processTapNames],
  );

  /**
   * Auto-scan variant — same POI search as handleMapPress but suppresses
   * the no-match ghost marker and toast. Used on initial map open.
   */
  const autoScan = useCallback(
    async (coordinate: LatLng) => {
      const now = Date.now();
      lastTapAt.current = now;

      try {
        const radius = computeSearchRadius(regionRef?.current ?? null);
        const cellKey = tapCellKey(
          coordinate.latitude,
          coordinate.longitude,
          radius,
        );
        const cached = cellCache.current.get(cellKey);

        if (cached && cached.expiresAt > Date.now()) {
          await processTapNames(cached.names, coordinate, true);
          return;
        }
        const names = await MapKitSearch.searchNearby(
          coordinate.latitude,
          coordinate.longitude,
          radius,
        );
        cellCache.current.set(cellKey, {
          names,
          expiresAt: Date.now() + TAP_CACHE_TTL_MS,
        });
        await processTapNames(names, coordinate, true);
      } catch {
        // Fail silently — auto-scan errors are not user-actionable.
      }
    },
    [processTapNames],
  );

  const resetTapPins = useCallback(() => {
    setTapPins([]);
    setLatestTapBatch([]);
  }, []);

  const clearLatestTapBatch = useCallback(() => setLatestTapBatch([]), []);

  const markTapPinAvoided = useCallback((entityId: string) => {
    setTapPins((prev) =>
      prev.map((p) => (p.id === entityId ? { ...p, avoided: true } : p)),
    );
  }, []);

  return {
    tapPins,
    tapSearching,
    tapNoMatch,
    tapNoMatchCoords,
    latestTapBatch,
    setLatestTapBatch,
    handleMapPress,
    handlePoiClick,
    autoScan,
    resetTapPins,
    clearLatestTapBatch,
    markTapPinAvoided,
  };
}
