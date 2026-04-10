import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Image, Pressable, Animated, StyleSheet, SafeAreaView, Linking, Platform, useWindowDimensions } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import type { Entity, PoliticalPerson } from '../../core/models';
import type { MatchingDeps } from '../../core/matching';
import type { StorageAdapter } from '../../core/data';
import {
  makeCacheDeps,
  recordEntityAvoid,
  getEntityAvoidsForDate,
  recordAvoidPin,
  getTodayAvoidPins,
  purgeOldAvoidPins,
} from '../../core/data';
import { useLocation } from './hooks/useLocation';
import { useEntityScan } from './hooks/useEntityScan';
import { useTapSearch } from './hooks/useTapSearch';
import { useMapControls } from './hooks/useMapControls';
import { BusinessCard, BusinessBanner, resolveCardMode } from './components/BusinessCard';
import { FOLDER_AUTO_DISMISS_MS, AMBER_PULSE_MS } from '../../config/constants';
import { FlagMarker } from './components/MapMarker';
import { MapSearchBar } from './components/MapSearchBar';
import { UnmatchedBanner } from './components/UnmatchedBanner';
import { MatchChooser } from './components/MatchChooser';
import { NoMatchToast } from './components/NoMatchToast';
import { NoMatchMarker } from './components/NoMatchMarker';
import { Tooltip } from '../../core/ui/Tooltip';
import type { MapPin, ScanResult } from './types';
import { MapControls } from './components/MapControls';
import { useMapHints } from './hooks/useMapHints';
import type { HintId } from './hooks/useMapHints';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { mapCopy } from '../../copy/map';
import { sharedCopy } from '../../copy/shared';
import { theme } from '../../design/tokens';
import { headerBar as HEADER_BAR_ASSET } from '../../core/ui/uiAssets';

interface MapScreenProps {
  entities: Entity[];
  people: PoliticalPerson[];
  adapter: StorageAdapter;
  fetchOrgs: MatchingDeps['fetchOrgs'];
  fetchOrgSummary: MatchingDeps['fetchOrgSummary'];
}

/**
 * Map screen — the core vertical slice of the MVP.
 *
 * Two match paths:
 *   Manual search — user types a business name and taps search.
 *   Tap-to-match  — user taps the map:
 *     iOS:     onPress → MKLocalPointsOfInterestRequest (via MapKitSearch native module)
 *     Android: onPoiClick → e.nativeEvent.name passed directly to matchEntity
 *
 * Session rule: GPS coordinates live only in component state.
 * They are never written to disk, transmitted, or passed to core/data.
 */
const HEADER_BAR_ASPECT = 1242 / 153;

const HINT_COPY: Record<HintId, string> = {
  search: mapCopy.hintSearch,
  tap: mapCopy.hintTap,
  barcode: mapCopy.hintBarcode,
};

const HINT_TAIL: Record<HintId, { tailDirection: 'up' | 'down' | null; tailOffset?: number }> = {
  search: { tailDirection: 'up', tailOffset: theme.space.xl },
  tap: { tailDirection: null },
  barcode: { tailDirection: 'down', tailOffset: theme.space.xl },
};

export function MapScreen({ entities, people, adapter, fetchOrgs, fetchOrgSummary }: MapScreenProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [searchText, setSearchText] = useState('');
  const [pins, setPins] = useState<MapPin[]>([]);
  const [activeResult, setActiveResult] = useState<ScanResult | null>(null);
  const isTextSearch = useRef(false);

  const avoidedTodayRef = useRef(new Set<string>());

  // Hydrate today's avoided entities + persisted pins on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await purgeOldAvoidPins(adapter);
      const [todayAvoids, todayPins] = await Promise.all([
        getEntityAvoidsForDate(adapter),
        getTodayAvoidPins(adapter),
      ]);
      if (cancelled) return;
      for (const a of todayAvoids) avoidedTodayRef.current.add(a.entityId);
      if (todayPins.length > 0) {
        setPins((prev) => {
          const existing = new Set(prev.map((p) => p.id));
          const hydrated: MapPin[] = todayPins
            .filter((p) => !existing.has(p.entityId))
            .map((p) => ({
              id: p.entityId,
              name: p.name,
              coords: { latitude: p.latitude, longitude: p.longitude },
              result: null,
              avoided: true,
            }));
          return [...prev, ...hydrated];
        });
      }
    })();
    return () => { cancelled = true; };
  }, [adapter]);

  const location = useLocation();
  const deps = useMemo<MatchingDeps>(
    () => ({ entities, fetchOrgs, fetchOrgSummary, ...makeCacheDeps(adapter) }),
    [entities, fetchOrgs, fetchOrgSummary, adapter]
  );

  const { status, result, scan, reset } = useEntityScan(deps, location.areaHash ?? '');
  const {
    mapRef, regionRef, defaultRegion,
    handleRegionChange, handleLocationPress, handleZoomIn, handleZoomOut,
  } = useMapControls(location.coords, location.requestLocation);

  const {
    tapPins, tapNoMatch, tapNoMatchCoords, latestTapBatch, setLatestTapBatch,
    handleMapPress, handlePoiClick, autoScan, resetTapPins, clearLatestTapBatch, markTapPinAvoided,
  } = useTapSearch(deps, location.areaHash ?? '', regionRef, avoidedTodayRef);

  // Auto-scan: when the map opens and location resolves, run a POI search at
  // the user's coordinates. Uses autoScan (not handleMapPress) to suppress
  // ghost markers and "No match found" toast on the initial load.
  const hasAutoScannedRef = useRef(false);
  useEffect(() => {
    if (hasAutoScannedRef.current || !location.coords) return;
    hasAutoScannedRef.current = true;
    autoScan(location.coords);
  }, [location.coords, autoScan]);

  const hints = useMapHints();
  const [avoidedResult, setAvoidedResult] = useState<ScanResult | null>(null);
  const [avoidAnimating, setAvoidAnimating] = useState(false);
  const amberPulseOpacity = useRef(new Animated.Value(0)).current;
  const avoidDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (status === 'matched' && result) setActiveResult(result); }, [status, result]);

  useEffect(() => {
    if (status !== 'matched' || !result || !location.coords || isTextSearch.current) return;
    const id = result.entityId ?? result.fecCommitteeId;
    if (!id) return;
    const alreadyAvoided = avoidedTodayRef.current.has(id);
    const newPin: MapPin = { id, name: result.matchedAlias || result.canonicalName, coords: location.coords, result, avoided: alreadyAvoided };
    setPins((prev) => prev.some((p) => p.id === id) ? prev : [...prev, newPin]);
  }, [status, result, location.coords]);

  const handleSearch = useCallback(async () => {
    if (!searchText.trim()) return;
    isTextSearch.current = true;
    setActiveResult(null); setPins([]); resetTapPins(); clearLatestTapBatch(); reset();
    await scan(searchText);
  }, [searchText, scan, reset, resetTapPins, clearLatestTapBatch, entities.length, status]);

  const finishDismiss = useCallback(() => {
    setActiveResult(null); setAvoidedResult(null); reset(); setSearchText('');
  }, [reset]);

  // Ref holds latest pins+tapPins so handleAvoid can access coordinates without
  // a circular dependency on the allPins memo.
  const allPinsRef = useRef<MapPin[]>([]);

  const handleAvoid = useCallback(async () => {
    if (!activeResult?.entity) return;
    const entityId = activeResult.entityId ?? activeResult.fecCommitteeId;
    if (avoidedTodayRef.current.has(entityId)) return;
    await recordEntityAvoid(adapter, entityId);
    avoidedTodayRef.current.add(entityId);
    // Persist pin coordinates for map hydration on next launch
    const pin = allPinsRef.current.find((p) => p.id === entityId);
    if (pin) {
      await recordAvoidPin(adapter, {
        entityId,
        latitude: pin.coords.latitude,
        longitude: pin.coords.longitude,
        name: pin.name,
      });
    }
    setPins((prev) => prev.map((p) => (p.id === entityId ? { ...p, avoided: true } : p)));
    markTapPinAvoided(entityId);
    setAvoidedResult(activeResult);
    setAvoidAnimating(true);
    // Amber pulse on map behind card
    Animated.sequence([
      Animated.timing(amberPulseOpacity, { toValue: 1, duration: AMBER_PULSE_MS / 2, useNativeDriver: true }),
      Animated.timing(amberPulseOpacity, { toValue: 0, duration: AMBER_PULSE_MS / 2, useNativeDriver: true }),
    ]).start();
    avoidDismissTimer.current = setTimeout(() => {
      setAvoidAnimating(false);
      finishDismiss();
    }, FOLDER_AUTO_DISMISS_MS);
  }, [activeResult, adapter, markTapPinAvoided, finishDismiss, amberPulseOpacity]);

  useEffect(() => () => { if (avoidDismissTimer.current) clearTimeout(avoidDismissTimer.current); }, []);

  const handleDismiss = useCallback(() => {
    if (avoidDismissTimer.current) clearTimeout(avoidDismissTimer.current);
    isTextSearch.current = false;
    setAvoidAnimating(false);
    setActiveResult(null); setAvoidedResult(null); clearLatestTapBatch(); reset();
  }, [reset, clearLatestTapBatch]);

  const handleNewResult = useCallback((r: ScanResult) => {
    if (avoidDismissTimer.current) clearTimeout(avoidDismissTimer.current);
    const entityId = r.entityId ?? r.fecCommitteeId;
    const alreadyAvoided = entityId ? avoidedTodayRef.current.has(entityId) : false;
    setAvoidedResult(alreadyAvoided ? r : null);
    setActiveResult(r);
  }, []);

  useEffect(() => {
    if (latestTapBatch.length === 1) { handleNewResult(latestTapBatch[0]); clearLatestTapBatch(); }
  }, [latestTapBatch, clearLatestTapBatch, handleNewResult]);

  const handleChooserSelect = useCallback((s: ScanResult) => { handleNewResult(s); clearLatestTapBatch(); }, [clearLatestTapBatch, handleNewResult]);
  const handleChooserDismiss = useCallback(() => { clearLatestTapBatch(); }, [clearLatestTapBatch]);

  const handleOpenSearch = useCallback(() => {
    Linking.openURL(`https://www.fec.gov/data/committees/?q=${encodeURIComponent(searchText)}`); reset();
  }, [searchText, reset]);

  const allPins = useMemo(() => {
    const pinKey = (p: MapPin) => `${p.id}-${p.coords.latitude}-${p.coords.longitude}`;
    const existing = new Set(pins.map(pinKey));
    const merged = [...pins, ...tapPins.filter((p) => !existing.has(pinKey(p)))];
    allPinsRef.current = merged;
    return merged;
  }, [pins, tapPins]);

  const cardMode = activeResult ? resolveCardMode(activeResult) : null;
  const showFullCard = cardMode === 'card';
  const bannerVariant = cardMode && typeof cardMode === 'object' ? cardMode.banner : null;
  const isCelebrating = avoidAnimating;
  const headerBarHeight = Math.round(screenWidth / HEADER_BAR_ASPECT);
  const SEARCH_TOP = insets.top + headerBarHeight + theme.space.md;

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef} style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={defaultRegion} onRegionChangeComplete={handleRegionChange}
        onPress={Platform.OS === 'ios' ? handleMapPress : undefined} onPoiClick={handlePoiClick}
        showsUserLocation showsMyLocationButton={false} accessibilityLabel={mapCopy.mapLabel}
      >
        {allPins.map((pin) => {
          const pinResult = pin.result;
          return (
            <FlagMarker key={`${pin.id}-${pin.coords.latitude}-${pin.coords.longitude}`} coordinate={pin.coords} name={pin.name} confidence={pinResult?.confidence ?? 1} avoided={pin.avoided}
              onPress={pinResult ? () => {
                const co = allPins.filter((p): p is MapPin & { result: ScanResult } => p.coords.latitude === pin.coords.latitude && p.coords.longitude === pin.coords.longitude && p.result !== null);
                co.length >= 2 ? setLatestTapBatch(co.map((p) => p.result)) : handleNewResult(pinResult);
              } : undefined} />
          );
        })}
        {tapNoMatchCoords.map((coord, i) => (
          <NoMatchMarker key={`ghost-${coord.latitude}-${coord.longitude}-${i}`} coordinate={coord} />
        ))}
      </MapView>

      <View style={[styles.headerBar, { height: insets.top + headerBarHeight }]} pointerEvents="none">
        <View style={[styles.headerBgStrip, { height: insets.top + Math.round(headerBarHeight * 0.15) }]}>
          <Image source={require('../../assets/pixel/bg_tile_dark_stone.png')} style={styles.headerBgTile} resizeMode="repeat" />
        </View>
        <Image source={HEADER_BAR_ASSET} style={[styles.headerBarImg, { top: insets.top, width: screenWidth, height: headerBarHeight }]} resizeMode="stretch" />
        <Image source={require('../../assets/pixel/brand/FF_logo_horizontal.png')} style={[styles.headerLogo, { marginTop: insets.top + Math.round(headerBarHeight * 0.15) }]} resizeMode="contain" accessibilityLabel={sharedCopy.appName} />
      </View>

      <MapSearchBar value={searchText} onChangeText={setSearchText} onSubmit={handleSearch} isScanning={status === 'scanning'} topOffset={SEARCH_TOP} />
      {hints.activeHint && !activeResult && (
        <>
          <Pressable
            style={styles.backdrop}
            onPress={() => hints.dismiss(hints.activeHint!)}
            accessibilityRole="button"
            accessibilityLabel={mapCopy.hintDismissLabel}
          />
          <Tooltip
            message={HINT_COPY[hints.activeHint]}
            tailDirection={HINT_TAIL[hints.activeHint].tailDirection}
            tailOffset={HINT_TAIL[hints.activeHint].tailOffset}
            style={
              hints.activeHint === 'search'
                ? { position: 'absolute', top: SEARCH_TOP + theme.a11y.minTapTarget + theme.space.sm, left: theme.space.lg, right: theme.space.lg, zIndex: 3 }
                : hints.activeHint === 'tap'
                  ? { position: 'absolute', top: SEARCH_TOP + theme.a11y.minTapTarget + 80, right: theme.space.xl, maxWidth: 220, zIndex: 3 }
                  : { position: 'absolute', bottom: theme.space.sm, right: theme.space.lg, maxWidth: 220, zIndex: 3 }
            }
          />
        </>
      )}
      <MapControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onLocation={handleLocationPress} locationLoading={location.loading} />

      {latestTapBatch.length >= 2 && !activeResult && <MatchChooser results={latestTapBatch} onSelect={handleChooserSelect} onDismiss={handleChooserDismiss} />}

      {activeResult && showFullCard && (
        <>
          <Pressable style={styles.backdrop} onPress={isCelebrating ? undefined : handleDismiss} accessibilityRole="button" accessibilityLabel={sharedCopy.dismissLabel} disabled={isCelebrating} />
          {/* Amber pulse overlay behind card */}
          <Animated.View style={[styles.amberPulse, { opacity: amberPulseOpacity }]} pointerEvents="none" />
          <View style={styles.cardContainer} pointerEvents={isCelebrating ? 'none' : 'auto'}>
            <BusinessCard result={activeResult} onAvoid={handleAvoid} avoidDisabled={!activeResult.entity} avoided={avoidedResult === activeResult || avoidedTodayRef.current.has(activeResult.entityId ?? activeResult.fecCommitteeId)} onDismiss={handleDismiss} allEntities={entities} people={people} avoidAnimating={avoidAnimating} />
          </View>
        </>
      )}

      {activeResult && bannerVariant && (
        <>
          <Pressable style={styles.backdrop} onPress={handleDismiss} accessibilityRole="button" accessibilityLabel={sharedCopy.dismissLabel} />
          <View style={styles.bannerContainer}>
            <BusinessBanner displayName={activeResult.matchedAlias || activeResult.canonicalName} variant={bannerVariant} onDismiss={handleDismiss} />
          </View>
        </>
      )}

      {(status === 'unmatched' || status === 'lookup_unavailable') && <UnmatchedBanner searchText={searchText} onOpenSearch={handleOpenSearch} variant={status === 'lookup_unavailable' ? 'lookup_unavailable' : 'no_match'} />}
      {tapNoMatch && !activeResult && <NoMatchToast />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: theme.colors.bgVoid },
  map:            { flex: 1 },
  headerBar:      { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, alignItems: 'center', overflow: 'visible' as const },
  headerBgStrip:  { position: 'absolute', top: 0, left: 0, width: '100%', overflow: 'hidden' },
  headerBgTile:   { width: '100%', height: '100%', transform: [{ scale: 2.5 }] },
  headerBarImg:   { position: 'absolute', left: 0 },
  headerLogo:     { height: 42, aspectRatio: 1536 / 322, zIndex: 3 },
  backdrop:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cardContainer:  { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'visible' as const, maxHeight: '65%', paddingTop: theme.space['3xl'] },
  bannerContainer:{ position: 'absolute', bottom: 80, left: 0, right: 0 },
  amberPulse:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.colors.amberPulse },
});
