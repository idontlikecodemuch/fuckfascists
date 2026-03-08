import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  SafeAreaView,
  Linking,
  Platform,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import type { Entity } from '../../core/models';
import type { MatchingDeps } from '../../core/matching';
import type { StorageAdapter } from '../../core/data';
import { makeCacheDeps, recordEntityAvoid } from '../../core/data';
import { useLocation } from './hooks/useLocation';
import { useEntityScan } from './hooks/useEntityScan';
import { BusinessCard } from './components/BusinessCard';
import { FlagMarker } from './components/MapMarker';
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
 * Flow: user centers map → searches a business name → matching pipeline
 * runs → flagged entities appear as pixel art pins → user taps AVOIDED
 * to record an avoidance event (date-only, no location stored).
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

  // Card effect — show BusinessCard whenever a match result arrives, regardless of GPS.
  useEffect(() => {
    if (status !== 'matched' || !result) return;
    setActiveResult(result);
  }, [status, result]);

  // Pin effect — place a map marker only when coords are also available.
  useEffect(() => {
    if (status !== 'matched' || !result || !location.coords) return;
    const id = result.entityId ?? result.fecCommitteeId;
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
    // DIAGNOSTIC — remove before ship
    console.log('[MapScreen] handleSearch fired — searchText:', JSON.stringify(searchText), 'entities:', entities.length, 'status:', status);
    if (!searchText.trim()) return;
    await scan(searchText);
  }, [searchText, scan, entities.length, status]);

  const handleAvoid = useCallback(async () => {
    if (!activeResult) return;
    const entityId = activeResult.entityId ?? activeResult.fecCommitteeId;
    await recordEntityAvoid(adapter, entityId);

    setPins((prev) =>
      prev.map((p) => (p.id === entityId ? { ...p, avoided: true } : p))
    );
    setActiveResult(null);
    reset();
    setSearchText('');
  }, [activeResult, adapter, reset]);

  const handleDismiss = useCallback(() => {
    setActiveResult(null);
    reset();
  }, [reset]);

  const handleOpenSearch = useCallback(() => {
    const q = encodeURIComponent(searchText || '');
    Linking.openURL(`https://www.fec.gov/data/committees/?q=${q}`);
    reset();
  }, [searchText, reset]);

  const mapRef = useRef<MapView>(null);
  const [currentRegion, setCurrentRegion] = useState<Region>(DEFAULT_REGION);

  // Animate to user's location whenever it is (re-)acquired.
  useEffect(() => {
    if (!location.coords) return;
    const next: Region = { ...location.coords, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    setCurrentRegion(next);
    mapRef.current?.animateToRegion(next, 400);
  }, [location.coords]);

  const handleZoomIn = useCallback(() => {
    const next: Region = { ...currentRegion, latitudeDelta: currentRegion.latitudeDelta / 2, longitudeDelta: currentRegion.longitudeDelta / 2 };
    setCurrentRegion(next);
    mapRef.current?.animateToRegion(next, 200);
  }, [currentRegion]);

  const handleZoomOut = useCallback(() => {
    const next: Region = { ...currentRegion, latitudeDelta: Math.min(currentRegion.latitudeDelta * 2, 90), longitudeDelta: Math.min(currentRegion.longitudeDelta * 2, 90) };
    setCurrentRegion(next);
    mapRef.current?.animateToRegion(next, 200);
  }, [currentRegion]);

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={DEFAULT_REGION}
        onRegionChangeComplete={setCurrentRegion}
        showsUserLocation
        showsMyLocationButton={false}
        accessibilityLabel="Map showing nearby flagged businesses"
      >
        {pins.map((pin) => (
          <FlagMarker
            key={pin.id}
            coordinate={pin.coords}
            name={pin.name}
            confidence={pin.result.confidence}
            avoided={pin.avoided}
            onPress={() => setActiveResult(pin.result)}
          />
        ))}
      </MapView>

      {/* ── Search bar ── */}
      <View style={[styles.searchContainer, { top: insets.top + 16 }]}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          placeholder="Search a business name..."
          placeholderTextColor="#888"
          returnKeyType="search"
          accessibilityLabel="Search for a business"
          accessibilityHint="Type a business name and press search to check its political donations"
          allowFontScaling
        />
        <Pressable
          onPress={handleSearch}
          style={[styles.searchButton, status === 'scanning' && styles.searchButtonBusy]}
          accessibilityRole="button"
          accessibilityLabel={status === 'scanning' ? 'Scanning…' : 'Search'}
          disabled={status === 'scanning'}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.searchButtonText} allowFontScaling>
            {status === 'scanning' ? '…' : '\u2315'}
          </Text>
        </Pressable>
      </View>

      {/* ── Map controls (zoom in, zoom out, location) ── */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocation={location.requestLocation}
        locationLoading={location.loading}
      />

      {/* ── Business card ── */}
      {activeResult && (
        <View style={styles.cardContainer}>
          <BusinessCard
            result={activeResult}
            onAvoid={handleAvoid}
            onDismiss={handleDismiss}
          />
        </View>
      )}

      {/* ── Unmatched notice ── */}
      {status === 'unmatched' && (
        <View style={styles.banner} accessibilityRole="alert">
          <Text style={styles.bannerText} allowFontScaling>
            "{searchText}" — not confidently matched.{' '}
          </Text>
          <Pressable
            onPress={handleOpenSearch}
            accessibilityRole="link"
            accessibilityLabel="Search FEC.gov directly"
          >
            <Text style={styles.bannerLink} allowFontScaling>
              Search FEC.gov ↗
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: BLACK },
  map:                { flex: 1 },
  searchContainer:    { position: 'absolute', top: 16, left: 16, right: 16, flexDirection: 'row' },
  searchInput:        { flex: 1, backgroundColor: WHITE, borderColor: BLACK, borderWidth: 3, paddingHorizontal: 12, height: 44, fontFamily: MONO, fontSize: 14, color: BLACK },
  searchButton:       { width: 44, height: 44, backgroundColor: BLACK, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: WHITE },
  searchButtonBusy:   { backgroundColor: '#555' },
  searchButtonText:   { color: WHITE, fontSize: 20 },
  cardContainer:      { position: 'absolute', bottom: 0, left: 0, right: 0 },
  banner:             { position: 'absolute', bottom: 80, left: 16, right: 16, backgroundColor: WHITE, borderWidth: 3, borderColor: '#CC7A00', padding: 12, flexDirection: 'row', flexWrap: 'wrap' },
  bannerText:         { fontFamily: MONO, fontSize: 12, color: BLACK },
  bannerLink:         { fontFamily: MONO, fontSize: 12, color: '#0066CC', textDecorationLine: 'underline' },
});
