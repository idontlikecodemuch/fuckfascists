import { Platform } from 'react-native';

interface MapKitSearchNativeModule {
  searchNearby(lat: number, lng: number, radiusMeters: number): Promise<string[]>;
}

/**
 * Attempts to load the native MapKitSearch module.
 *
 * The module is available only on iOS after running `expo prebuild` and
 * building the native project (EAS Build or local Xcode build). In Expo Go,
 * the managed workflow without prebuild, and on all Android builds, this
 * returns null and all calls resolve to [].
 *
 * Integration steps for iOS:
 *   1. Run `expo prebuild --platform ios` to generate the /ios directory.
 *   2. Copy ios/MapKitSearchModule.swift into the Xcode project target.
 *   3. Build with `expo run:ios` or EAS Build.
 */
function loadModule(): MapKitSearchNativeModule | null {
  if (Platform.OS !== 'ios') return null;
  try {
    // expo-modules-core is a transitive dependency of expo SDK 52.
    // requireNativeModule throws when the module is not yet linked — safe to catch.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireNativeModule } = require('expo-modules-core') as typeof import('expo-modules-core');
    return requireNativeModule<MapKitSearchNativeModule>('MapKitSearch');
  } catch {
    return null;
  }
}

const _module = loadModule();

export const MapKitSearch = {
  /**
   * True when the native MapKitSearch module is linked.
   * False in Expo Go, before expo prebuild, and on Android.
   */
  isAvailable: _module !== null,

  /**
   * Returns POI names within radiusMeters of the given coordinate.
   *
   * Uses MKLocalPointsOfInterestRequest — NOT MKLocalSearch.Request, which
   * requires a naturalLanguageQuery and throws MKErrorDomain error 4 without one.
   *
   * Does NOT access device GPS. The coordinate comes from a MapView tap event.
   * Returns [] immediately when the native module is not linked.
   */
  searchNearby(lat: number, lng: number, radiusMeters: number): Promise<string[]> {
    if (!_module) return Promise.resolve([]);
    return _module.searchNearby(lat, lng, radiusMeters);
  },
} as const;
