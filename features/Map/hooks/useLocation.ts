import { useState, useCallback } from 'react';
import * as ExpoLocation from 'expo-location';
import { toAreaHash } from '../utils/areaHash';

export interface LocationState {
  /** null = permission not yet requested */
  permitted: boolean | null;
  loading: boolean;
  error: string | null;
  /** Rough-area token derived from coords — safe for use as a cache key. */
  areaHash: string | null;
  /**
   * Raw coordinates for map display ONLY.
   * Never persist, transmit, or log these values.
   */
  coords: { latitude: number; longitude: number } | null;
}

const INITIAL: LocationState = {
  permitted: null,
  loading: false,
  error: null,
  areaHash: null,
  coords: null,
};

/**
 * Requests foreground location permission and retrieves the current position.
 * Session-only — nothing is written to disk or transmitted.
 *
 * Exposes `areaHash` (a ~1km grid token) for cache key use.
 * Exposes `coords` for map centering only — do not persist or pass downstream.
 */
export function useLocation() {
  const [state, setState] = useState<LocationState>(INITIAL);

  const requestLocation = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();

    if (status !== ExpoLocation.PermissionStatus.GRANTED) {
      setState({
        ...INITIAL,
        permitted: false,
        error: 'Location permission denied. Use the search bar to look up a business manually.',
      });
      return;
    }

    try {
      const { coords } = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      setState({
        permitted: true,
        loading: false,
        error: null,
        areaHash: toAreaHash(coords.latitude, coords.longitude),
        coords: { latitude: coords.latitude, longitude: coords.longitude },
      });
    } catch {
      setState({
        ...INITIAL,
        permitted: true,
        error: 'Unable to get location. Check your device settings.',
      });
    }
  }, []);

  return { ...state, requestLocation };
}
