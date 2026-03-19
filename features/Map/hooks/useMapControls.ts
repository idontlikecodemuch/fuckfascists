import { useCallback, useRef, useEffect } from 'react';
import type MapView from 'react-native-maps';
import type { Region } from 'react-native-maps';

const DEFAULT_REGION: Region = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

/**
 * Encapsulates map camera state: zoom, region tracking, initial centering,
 * and explicit recenter-on-me. Keeps MapScreen focused on data flow.
 */
export function useMapControls(
  coords: { latitude: number; longitude: number } | null,
  requestLocation: () => Promise<void>,
) {
  const mapRef = useRef<MapView>(null);
  const regionRef = useRef<Region>(DEFAULT_REGION);

  // Center map once on initial location.
  const hasInitiallyCentered = useRef(false);
  useEffect(() => {
    if (hasInitiallyCentered.current || !coords) return;
    hasInitiallyCentered.current = true;
    const next: Region = { ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    regionRef.current = next;
    mapRef.current?.animateToRegion(next, 400);
  }, [coords]);

  const handleRegionChange = useCallback((r: Region) => { regionRef.current = r; }, []);

  // Explicit "center on me" — user tapped the location button.
  const pendingRecenter = useRef(false);
  const handleLocationPress = useCallback(async () => {
    pendingRecenter.current = true;
    await requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (!pendingRecenter.current || !coords) return;
    pendingRecenter.current = false;
    const next: Region = { ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    regionRef.current = next;
    mapRef.current?.animateToRegion(next, 400);
  }, [coords]);

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

  return {
    mapRef,
    regionRef,
    defaultRegion: DEFAULT_REGION,
    handleRegionChange,
    handleLocationPress,
    handleZoomIn,
    handleZoomOut,
  };
}
