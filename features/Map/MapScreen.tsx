import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, Linking, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import type { Entity } from '../../core/models';
import type { MatchingDeps } from '../../core/matching';
import type { StorageAdapter } from '../../core/data';
import { makeCacheDeps, recordEntityAvoid } from '../../core/data';
import { useLocation } from './hooks/useLocation';
import { useEntityScan } from './hooks/useEntityScan';
import { useTapSearch } from './hooks/useTapSearch';
import { BusinessCard } from './components/BusinessCard';
import { FlagMarker } from './components/MapMarker';
import { MapSearchBar } from './components/MapSearchBar';
import { UnmatchedBanner } from './components/UnmatchedBanner';
import { TapLoadingMarker } from './components/TapLoadingMarker';
import { MatchChooser } from './components/MatchChooser';
import type { MapPin, ScanResult } from './types';
import { MapControls } from './components/MapControls';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MapScreenProps {
  entities: Entity[];
  adapter: StorageAdapter;
  fetchOrgs: MatchingDeps['fetchOrgs'];
  fetchOrgSummary: MatchingDeps['fetchOrgSummary'];
}

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

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
export function MapScreen({ entities, adapter, fetchOrgs, fetchOrgSummary }: MapScreenProps) {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [pins, setPins] = useState<MapPin[]>([]);
  const [activeResult, setActiveResult] = useState<ScanResult | null>(null);

  const location = useLocation();

  const deps = useMemo<MatchingDeps>(
    () => ({ entities, fetchOrgs, fetchOrgSummary, ...makeCacheDeps(adapter) }),
    [entities, fetchOrgs, fetchOrgSummary, adapter]
  );

  const { status, result, scan, reset } = useEntityScan(deps, location.areaHash ?? '');
  const mapRef = useRef<MapView>(null);
  const regionRef = useRef<Region>(DEFAULT_REGION);

  const {
    tapPins, tapLoadingCoord, latestTapBatch,
    handleMapPress, handlePoiClick, resetTapPins, clearLatestTapBatch, markTapPinAvoided,
  } = useTapSearch(deps, location.areaHash ?? '', regionRef);

  // Card effect — show BusinessCard whenever a match result arrives.
  useEffect(() => {
    if (status !== 'matched' || !result) return;
    setActiveResult(result);
  }, [status, result]);

  // Pin effect — place a map marker when coords are also available.
  useEffect(() => {
    if (status !== 'matched' || !result || !location.coords) return;
    const id = result.entityId ?? result.fecCommitteeId;
    // Guard: empty/falsy id causes a nil key on FlagMarker, crashing AIRMap.
    if (!id) return;
    const newPin: MapPin = {
      id,
      name: result.canonicalName,
      coords: location.coords, // session-only — not persisted
      result,
      avoided: false,
    };
    setPins((prev) => {
      const exists = prev.some((p) => p.id === id);
      return exists ? prev : [...prev, newPin];
    });
  }, [status, result, location.coords]);

  const handleSearch = useCallback(async () => {
    if (!searchText.trim()) return;
    setActiveResult(null);
    setPins([]);
    resetTapPins();
    clearLatestTapBatch();
    reset();
    await scan(searchText);
  }, [searchText, scan, reset, resetTapPins, clearLatestTapBatch, entities.length, status]);

  const handleAvoid = useCallback(async () => {
    if (!activeResult?.entity) return;
    const entityId = activeResult.entityId ?? activeResult.fecCommitteeId;
    await recordEntityAvoid(adapter, entityId);
    setPins((prev) => prev.map((p) => (p.id === entityId ? { ...p, avoided: true } : p)));
    markTapPinAvoided(entityId);
    setActiveResult(null);
    reset();
    setSearchText('');
  }, [activeResult, adapter, reset, markTapPinAvoided]);

  const handleDismiss = useCallback(() => {
    setActiveResult(null);
    clearLatestTapBatch();
    reset();
  }, [reset, clearLatestTapBatch]);

  // Tap batch effect — auto-select when a single tap returns exactly 1 match.
  // When 2+ matches arrive, the MatchChooser renders (no auto-select).
  useEffect(() => {
    if (latestTapBatch.length === 1) {
      setActiveResult(latestTapBatch[0]);
      clearLatestTapBatch();
    }
  }, [latestTapBatch, clearLatestTapBatch]);

  const handleChooserSelect = useCallback((selected: ScanResult) => {
    setActiveResult(selected);
    clearLatestTapBatch();
  }, [clearLatestTapBatch]);

  const handleChooserDismiss = useCallback(() => {
    clearLatestTapBatch();
  }, [clearLatestTapBatch]);

  const handleOpenSearch = useCallback(() => {
    Linking.openURL(`https://www.fec.gov/data/committees/?q=${encodeURIComponent(searchText)}`);
    reset();
  }, [searchText, reset]);

  // Center the map on the user's location exactly once after the initial
  // auto-request completes. Subsequent location updates (e.g. from the
  // location button) are handled by handleLocationPress — not this effect.
  const hasInitiallyCentered = useRef(false);
  useEffect(() => {
    if (hasInitiallyCentered.current || !location.coords) return;
    hasInitiallyCentered.current = true;
    const next: Region = { ...location.coords, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    regionRef.current = next;
    mapRef.current?.animateToRegion(next, 400);
  }, [location.coords]);

  const handleRegionChange = useCallback((r: Region) => {
    regionRef.current = r;
  }, []);

  // Explicit "center on me" — user tapped the location button.
  // pendingRecenter flag tells the effect below to animate when coords arrive.
  const pendingRecenter = useRef(false);
  const handleLocationPress = useCallback(async () => {
    pendingRecenter.current = true;
    await location.requestLocation();
  }, [location.requestLocation]);

  useEffect(() => {
    if (!pendingRecenter.current || !location.coords) return;
    pendingRecenter.current = false;
    const next: Region = { ...location.coords, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    regionRef.current = next;
    mapRef.current?.animateToRegion(next, 400);
  }, [location.coords]);

  const handleZoomIn = useCallback(() => {
    const cur = regionRef.current;
    const next: Region = { ...cur, latitudeDelta: cur.latitudeDelta / 2, longitudeDelta: cur.longitudeDelta / 2 };
    regionRef.current = next;
    mapRef.current?.animateToRegion(next, 200);
  }, []);

  const handleZoomOut = useCallback(() => {
    const cur = regionRef.current;
    const next: Region = { ...cur, latitudeDelta: Math.min(cur.latitudeDelta * 2, 90), longitudeDelta: Math.min(cur.longitudeDelta * 2, 90) };
    regionRef.current = next;
    mapRef.current?.animateToRegion(next, 200);
  }, []);

  const allPins = useMemo(() => {
    const pinKey = (p: MapPin) => `${p.id}-${p.coords.latitude}-${p.coords.longitude}`;
    const existingKeys = new Set(pins.map(pinKey));
    return [...pins, ...tapPins.filter((p) => !existingKeys.has(pinKey(p)))];
  }, [pins, tapPins]);

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={DEFAULT_REGION}
        onRegionChangeComplete={handleRegionChange}
        // iOS: tap anywhere → MKLocalPointsOfInterestRequest within 50m
        onPress={Platform.OS === 'ios' ? handleMapPress : undefined}
        // Android: tap a labeled POI → e.nativeEvent.name passed to matchEntity
        onPoiClick={handlePoiClick}
        showsUserLocation
        showsMyLocationButton={false}
        accessibilityLabel="Map showing nearby flagged businesses"
      >
        {allPins.map((pin) => (
          <FlagMarker
            key={`${pin.id}-${pin.coords.latitude}-${pin.coords.longitude}`}
            coordinate={pin.coords}
            name={pin.name}
            confidence={pin.result.confidence}
            avoided={pin.avoided}
            onPress={() => setActiveResult(pin.result)}
          />
        ))}
        {tapLoadingCoord && <TapLoadingMarker coordinate={tapLoadingCoord} />}
      </MapView>

      <MapSearchBar
        value={searchText}
        onChangeText={setSearchText}
        onSubmit={handleSearch}
        isScanning={status === 'scanning'}
        topOffset={insets.top + 16}
      />

      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocation={handleLocationPress}
        locationLoading={location.loading}
      />

      {latestTapBatch.length >= 2 && !activeResult && (
        <MatchChooser
          results={latestTapBatch}
          onSelect={handleChooserSelect}
          onDismiss={handleChooserDismiss}
        />
      )}

      {activeResult && (
        <View style={styles.cardContainer}>
          <BusinessCard
            result={activeResult}
            onAvoid={handleAvoid}
            avoidDisabled={!activeResult.entity}
            onDismiss={handleDismiss}
          />
        </View>
      )}

      {(status === 'unmatched' || status === 'lookup_unavailable') && (
        <UnmatchedBanner
          searchText={searchText}
          onOpenSearch={handleOpenSearch}
          variant={status === 'lookup_unavailable' ? 'lookup_unavailable' : 'no_match'}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#1A1A1A' },
  map:          { flex: 1 },
  cardContainer: { position: 'absolute', bottom: 0, left: 0, right: 0 },
});
