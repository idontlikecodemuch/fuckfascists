import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
        accessibilityLabel="Zoom in"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.buttonText} allowFontScaling={false}>+</Text>
      </Pressable>

      <Pressable
        onPress={onZoomOut}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Zoom out"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.buttonText} allowFontScaling={false}>−</Text>
      </Pressable>

      <Pressable
        onPress={onLocation}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Center map on my location"
        disabled={locationLoading}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {locationLoading
          ? <Text style={styles.buttonText} allowFontScaling={false}>…</Text>
          : <Ionicons name="locate" size={22} color={BLACK} />
        }
      </Pressable>
    </View>
  );
}

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';

const styles = StyleSheet.create({
  stack:      { position: 'absolute', bottom: 120, right: 16, gap: 8 },
  button:     { width: 44, height: 44, backgroundColor: WHITE, borderWidth: 3, borderColor: BLACK, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 22, color: BLACK, lineHeight: 26 },
});
