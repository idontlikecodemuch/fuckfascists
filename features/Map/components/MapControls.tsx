import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocation: () => void;
  locationLoading: boolean;
}

/**
 * Stacked map control buttons: zoom in (+), zoom out (−), center on location (locate).
 * Positioned absolute — intended for the bottom-right of the map.
 */
export function MapControls({ onZoomIn, onZoomOut, onLocation, locationLoading }: MapControlsProps) {
  return (
    <View style={styles.stack}>
      <Pressable
        onPress={onZoomIn}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={mapCopy.zoomInLabel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.buttonText} allowFontScaling={false}>{mapCopy.zoomIn}</Text>
      </Pressable>

      <Pressable
        onPress={onZoomOut}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={mapCopy.zoomOutLabel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.buttonText} allowFontScaling={false}>{mapCopy.zoomOut}</Text>
      </Pressable>

      <Pressable
        onPress={onLocation}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel={mapCopy.locationLabel}
        disabled={locationLoading}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {locationLoading
          ? <Text style={styles.buttonText} allowFontScaling={false}>{mapCopy.loadingIcon}</Text>
          : <Ionicons name="locate" size={22} color={theme.colors.textPrimary} />
        }
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack:      { position: 'absolute', bottom: 120, right: theme.space.lg, gap: theme.space.sm },
  button:     { width: 48, height: 48, backgroundColor: theme.colors.bgNav, borderWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 22, color: theme.colors.textPrimary, lineHeight: 26 },
});
