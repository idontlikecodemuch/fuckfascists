import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, Text, Image, Pressable, StyleSheet, SafeAreaView, Linking, Platform, Animated, AccessibilityInfo } from 'react-native';
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
import { mapCopy } from '../../copy/map';
import { sharedCopy } from '../../copy/shared';
import { theme } from '../../design/tokens';

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
  /** Tracks whether the current result came from a text search (true) or map tap (false). */
  const isTextSearch = useRef(false);

  const location = useLocation();

  const deps = useMemo<MatchingDeps>(
    () => ({ entities, fetchOrgs, fetchOrgSummary, ...makeCacheDeps(adapter) }),
    [entities, fetchOrgs, fetchOrgSummary, adapter]
  );

  const { status, result, scan, reset } = useEntityScan(deps, location.areaHash ?? '');
  const mapRef = useRef<MapView>(null);
  const regionRef = useRef<Region>(DEFAULT_REGION);

  const {
    tapPins, tapLoadingCoord, latestTapBatch, setLatestTapBatch,
    handleMapPress, handlePoiClick, resetTapPins, clearLatestTapBatch, markTapPinAvoided,
  } = useTapSearch(deps, location.areaHash ?? '', regionRef);

  // Avoid celebration: 3s delay before dismiss, then fade+shrink animation.
  const [avoidedResult, setAvoidedResult] = useState<ScanResult | null>(null);
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const reducedMotionRef = useRef(false);
  const avoidDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!cancelled) reducedMotionRef.current = v;
    });
    return () => { cancelled = true; };
  }, []);

  // Card effect — show BusinessCard whenever a match result arrives.
  useEffect(() => {
    if (status !== 'matched' || !result) return;
    setActiveResult(result);
  }, [status, result]);

  // Pin effect — place a map marker when coords are also available.
  // Only drops pins for POI tap matches, not text searches (searched business might not be nearby).
  useEffect(() => {
    if (status !== 'matched' || !result || !location.coords) return;
    if (isTextSearch.current) return;
    const id = result.entityId ?? result.fecCommitteeId;
    // Guard: empty/falsy id causes a nil key on FlagMarker, crashing AIRMap.
    if (!id) return;
    const newPin: MapPin = {
      id,
      name: result.matchedAlias || result.canonicalName,
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
    isTextSearch.current = true;
    setActiveResult(null);
    setPins([]);
    resetTapPins();
    clearLatestTapBatch();
    reset();
    await scan(searchText);
  }, [searchText, scan, reset, resetTapPins, clearLatestTapBatch, entities.length, status]);

  const dismissAfterAvoid = useCallback(() => {
    const finishDismiss = () => {
      setActiveResult(null);
      setAvoidedResult(null);
      reset();
      setSearchText('');
      cardOpacity.setValue(1);
      cardScale.setValue(1);
    };

    if (reducedMotionRef.current) {
      // Reduced-motion: plain dismiss after 3s, no animation.
      finishDismiss();
    } else {
      // Fade + shrink: opacity 1→0, scale 1→0.95, 400ms ease-out.
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 0.95, duration: 400, useNativeDriver: true }),
      ]).start(() => finishDismiss());
    }
  }, [reset, cardOpacity, cardScale]);

  const handleAvoid = useCallback(async () => {
    if (!activeResult?.entity) return;
    const entityId = activeResult.entityId ?? activeResult.fecCommitteeId;
    await recordEntityAvoid(adapter, entityId);
    setPins((prev) => prev.map((p) => (p.id === entityId ? { ...p, avoided: true } : p)));
    markTapPinAvoided(entityId);
    // Mark as avoided so the card shows the defeated sprite/topband.
    setAvoidedResult(activeResult);
    // Dismiss after 3 seconds so the user sees the celebration.
    avoidDismissTimer.current = setTimeout(dismissAfterAvoid, 3000);
  }, [activeResult, adapter, markTapPinAvoided, dismissAfterAvoid]);

  // Cleanup the timer on unmount.
  useEffect(() => {
    return () => {
      if (avoidDismissTimer.current) clearTimeout(avoidDismissTimer.current);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    if (avoidDismissTimer.current) clearTimeout(avoidDismissTimer.current);
    isTextSearch.current = false;
    setActiveResult(null);
    setAvoidedResult(null);
    clearLatestTapBatch();
    reset();
    cardOpacity.setValue(1);
    cardScale.setValue(1);
  }, [reset, clearLatestTapBatch, cardOpacity, cardScale]);

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

  const HEADER_HEIGHT = 36;

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Branded header bar ── */}
      <View style={styles.headerBar}>
        <Image
          source={require('../../assets/pixel/brand/FF_logo_horizontal.png')}
          style={styles.headerLogo}
          resizeMode="contain"
          accessibilityLabel={sharedCopy.appName}
        />
      </View>

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
        accessibilityLabel={mapCopy.mapLabel}
      >
        {allPins.map((pin) => (
          <FlagMarker
            key={`${pin.id}-${pin.coords.latitude}-${pin.coords.longitude}`}
            coordinate={pin.coords}
            name={pin.name}
            confidence={pin.result.confidence}
            avoided={pin.avoided}
            onPress={() => {
              // If multiple pins share the same coords, show the chooser instead
              // of jumping to a single card.
              const colocated = allPins.filter(
                (p) => p.coords.latitude === pin.coords.latitude && p.coords.longitude === pin.coords.longitude
              );
              if (colocated.length >= 2) {
                setLatestTapBatch(colocated.map((p) => p.result));
              } else {
                setActiveResult(pin.result);
              }
            }}
          />
        ))}
        {tapLoadingCoord && <TapLoadingMarker coordinate={tapLoadingCoord} />}
      </MapView>

      <MapSearchBar
        value={searchText}
        onChangeText={setSearchText}
        onSubmit={handleSearch}
        isScanning={status === 'scanning'}
        topOffset={HEADER_HEIGHT + insets.top + theme.space.sm}
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
        <>
          <Pressable
            style={styles.backdrop}
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel={sharedCopy.dismissLabel}
          />
          <Animated.View style={[styles.cardContainer, { opacity: cardOpacity, transform: [{ scale: cardScale }] }]}>
            <BusinessCard
              result={activeResult}
              onAvoid={handleAvoid}
              avoidDisabled={!activeResult.entity}
              avoided={avoidedResult === activeResult || allPins.some((p) => p.result === activeResult && p.avoided)}
              onDismiss={handleDismiss}
              allEntities={entities}
            />
          </Animated.View>
        </>
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
  container:     { flex: 1, backgroundColor: theme.colors.bgVoid },
  headerBar:     { backgroundColor: theme.colors.surface1, paddingHorizontal: theme.space.lg, paddingVertical: theme.space.sm, borderBottomWidth: theme.borders.standard.width, borderBottomColor: theme.colors.frameBlue },
  headerLogo:    { height: 28, aspectRatio: 1536 / 322 },
  map:           { flex: 1 },
  backdrop:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  cardContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'visible' as const },
});
