import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

// Same flag asset as FlagMarker — rendered greyscale at 50% opacity.
const MARKER_FLAG = require('../../../assets/pixel/marker_flag_default.png');

interface NoMatchMarkerProps {
  coordinate: { latitude: number; longitude: number };
}

/**
 * Greyed-out ghost flag marker at a tap location when no entity match is found.
 * Uses the same flag asset as FlagMarker but tinted grey at 50% opacity.
 * Persists until the user navigates away from the map tab (component unmount).
 * Not tappable — visual indicator only.
 */
export function NoMatchMarker({ coordinate }: NoMatchMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      tappable={false}
      accessibilityLabel={mapCopy.tapNoMatch}
    >
      <Image source={MARKER_FLAG} style={styles.ghostFlag} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  ghostFlag: {
    width: 32,
    height: 32,
    opacity: 0.8,
    tintColor: theme.colors.textSecondary,
  },
});
