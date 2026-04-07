import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

interface NoMatchMarkerProps {
  coordinate: { latitude: number; longitude: number };
}

/**
 * Greyed-out ghost marker at a tap location when no entity match is found.
 * Persists until the user navigates away from the map tab (component unmount).
 * Not tappable — visual indicator only.
 */
export function NoMatchMarker({ coordinate }: NoMatchMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tappable={false}
      accessibilityLabel={mapCopy.tapNoMatch}
    >
      <View style={styles.ghost} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  ghost: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.textSecondary,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.panelBorder,
    opacity: 0.5,
  },
});
