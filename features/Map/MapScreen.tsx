import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Image, Pressable, StyleSheet, SafeAreaView, Linking, Platform, useWindowDimensions } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import type { Entity } from '../../core/models';
import type { MatchingDeps } from '../../core/matching';
import type { StorageAdapter } from '../../core/data';
import { makeCacheDeps, recordEntityAvoid } from '../../core/data';
import { useLocation } from './hooks/useLocation';
import { useEntityScan } from './hooks/useEntityScan';
import { useTapSearch } from './hooks/useTapSearch';
import { useMapControls } from './hooks/useMapControls';
import { BusinessCard, BusinessBanner, resolveCardMode } from './components/BusinessCard';
import { FXLayer, useFX, defaultFXRegistry } from '../../core/fx';
import { FX_AVOID_DURATION_MS } from '../../config/constants';
import { FlagMarker } from './components/MapMarker';
import { MapSearchBar } from './components/MapSearchBar';
import { UnmatchedBanner } from './components/UnmatchedBanner';
import { TapLoadingMarker } from './components/TapLoadingMarker';
import { MatchChooser } from './components/MatchChooser';
import { NoMatchToast } from './components/NoMatchToast';
import { HintBanner } from './components/HintBanner';
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

export function MapScreen({ entities, adapter, fetchOrgs, fetchOrgSummary }: MapScreenProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [searchText, setSearchText] = useState('');
  const [pins, setPins] = useState<MapPin[]>([]);
  const [activeResult, setActiveResult] = useState<ScanResult | null>(null);
  const isTextSearch = useRef(false);

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
    tapPins, tapLoadingCoord, tapNoMatch, latestTapBatch, setLatestTapBatch,
    handleMapPress, handlePoiClick, resetTapPins, clearLatestTapBatch, markTapPinAvoided,
  } = useTapSearch(deps, location.areaHash ?? '', regionRef);

  const hints = useMapHints();
  const fx = useFX();
  const [avoidedResult, setAvoidedResult] = useState<ScanResult | null>(null);
  const avoidDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (status === 'matched' && result) setActiveResult(result); }, [status, result]);

  useEffect(() => {
    if (status !== 'matched' || !result || !location.coords || isTextSearch.current) return;
    const id = result.entityId ?? result.fecCommitteeId;
    if (!id) return;
    const newPin: MapPin = { id, name: result.matchedAlias || result.canonicalName, coords: location.coords, result, avoided: false };
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

  const handleAvoid = useCallback(async () => {
    if (!activeResult?.entity) return;
    const entityId = activeResult.entityId ?? activeResult.fecCommitteeId;
    await recordEntityAvoid(adapter, entityId);
    setPins((prev) => prev.map((p) => (p.id === entityId ? { ...p, avoided: true } : p)));
    markTapPinAvoided(entityId);
    setAvoidedResult(activeResult);
    fx.fire('avoid', 'full');
    avoidDismissTimer.current = setTimeout(finishDismiss, FX_AVOID_DURATION_MS);
  }, [activeResult, adapter, markTapPinAvoided, finishDismiss]);

  useEffect(() => () => { if (avoidDismissTimer.current) clearTimeout(avoidDismissTimer.current); }, []);

  const handleDismiss = useCallback(() => {
    if (avoidDismissTimer.current) clearTimeout(avoidDismissTimer.current);
    isTextSearch.current = false;
    setActiveResult(null); setAvoidedResult(null); clearLatestTapBatch(); reset();
  }, [reset, clearLatestTapBatch]);

  const handleNewResult = useCallback((r: ScanResult) => {
    if (avoidDismissTimer.current) clearTimeout(avoidDismissTimer.current);
    setAvoidedResult(null); setActiveResult(r);
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
    return [...pins, ...tapPins.filter((p) => !existing.has(pinKey(p)))];
  }, [pins, tapPins]);

  const cardMode = activeResult ? resolveCardMode(activeResult) : null;
  const showFullCard = cardMode === 'card';
  const bannerVariant = cardMode && typeof cardMode === 'object' ? cardMode.banner : null;
  const isCelebrating = fx.active;
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
        {allPins.map((pin) => (
          <FlagMarker key={`${pin.id}-${pin.coords.latitude}-${pin.coords.longitude}`} coordinate={pin.coords} name={pin.name} confidence={pin.result.confidence} avoided={pin.avoided}
            onPress={() => {
              const co = allPins.filter((p) => p.coords.latitude === pin.coords.latitude && p.coords.longitude === pin.coords.longitude);
              co.length >= 2 ? setLatestTapBatch(co.map((p) => p.result)) : handleNewResult(pin.result);
            }} />
        ))}
        {tapLoadingCoord && <TapLoadingMarker coordinate={tapLoadingCoord} />}
      </MapView>

      <View style={[styles.headerBar, { height: insets.top + headerBarHeight }]} pointerEvents="none">
        <View style={[styles.headerBgStrip, { height: insets.top + Math.round(headerBarHeight * 0.1) }]} />
        <Image source={HEADER_BAR_ASSET} style={[styles.headerBarImg, { top: insets.top, width: screenWidth, height: headerBarHeight }]} resizeMode="stretch" />
        <Image source={require('../../assets/pixel/brand/FF_logo_horizontal.png')} style={[styles.headerLogo, { marginTop: insets.top + Math.round(headerBarHeight * 0.1) }]} resizeMode="contain" accessibilityLabel={sharedCopy.appName} />
      </View>

      <MapSearchBar value={searchText} onChangeText={setSearchText} onSubmit={handleSearch} isScanning={status === 'scanning'} topOffset={SEARCH_TOP} />
      {hints.activeHint && !activeResult && (
        <View style={[styles.hintContainer, { top: SEARCH_TOP + theme.a11y.minTapTarget + theme.space.xs }]}>
          <HintBanner message={HINT_COPY[hints.activeHint]} onDismiss={() => hints.dismiss(hints.activeHint!)} />
        </View>
      )}
      <MapControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onLocation={handleLocationPress} locationLoading={location.loading} />

      {latestTapBatch.length >= 2 && !activeResult && <MatchChooser results={latestTapBatch} onSelect={handleChooserSelect} onDismiss={handleChooserDismiss} />}

      {activeResult && showFullCard && (
        <>
          <Pressable style={styles.backdrop} onPress={isCelebrating ? undefined : handleDismiss} accessibilityRole="button" accessibilityLabel={sharedCopy.dismissLabel} disabled={isCelebrating} />
          <View style={styles.cardContainer} pointerEvents={isCelebrating ? 'none' : 'auto'}>
            <BusinessCard result={activeResult} onAvoid={handleAvoid} avoidDisabled={!activeResult.entity} avoided={avoidedResult === activeResult || allPins.some((p) => p.result === activeResult && p.avoided)} onDismiss={handleDismiss} allEntities={entities} />
          </View>
        </>
      )}

      {activeResult && bannerVariant && (
        <View style={styles.bannerContainer}>
          <BusinessBanner displayName={activeResult.matchedAlias || activeResult.canonicalName} variant={bannerVariant} onDismiss={handleDismiss} />
        </View>
      )}

      <FXLayer entries={fx.entries} registry={defaultFXRegistry} reducedMotion={fx.reducedMotion} onComplete={fx.remove} />

      {(status === 'unmatched' || status === 'lookup_unavailable') && <UnmatchedBanner searchText={searchText} onOpenSearch={handleOpenSearch} variant={status === 'lookup_unavailable' ? 'lookup_unavailable' : 'no_match'} />}
      {tapNoMatch && !activeResult && <NoMatchToast />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: theme.colors.bgVoid },
  map:            { flex: 1 },
  headerBar:      { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 2, alignItems: 'center', overflow: 'visible' as const },
  headerBgStrip:  { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: theme.colors.bgVoid },
  headerBarImg:   { position: 'absolute', left: 0 },
  headerLogo:     { height: 28, aspectRatio: 1536 / 322, zIndex: 3 },
  backdrop:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cardContainer:  { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'visible' as const, maxHeight: '65%' },
  hintContainer:  { position: 'absolute', left: theme.space.lg, right: theme.space.lg, zIndex: 1 },
  bannerContainer:{ position: 'absolute', bottom: 80, left: 0, right: 0 },
});
