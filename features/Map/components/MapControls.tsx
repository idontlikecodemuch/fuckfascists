import React from 'react';
import { View, Pressable, Text, ImageBackground, StyleSheet } from 'react-native';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { btnCirclePlus, btnCircleArrow, btnCircleTarget } from '../../../core/ui/uiAssets';

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
        accessibilityRole="button"
        accessibilityLabel={mapCopy.zoomInLabel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ImageBackground source={btnCirclePlus} resizeMode="contain" style={styles.button}>
          <Text style={styles.buttonText} allowFontScaling={false}>{mapCopy.zoomIn}</Text>
        </ImageBackground>
      </Pressable>

      <Pressable
        onPress={onZoomOut}
        accessibilityRole="button"
        accessibilityLabel={mapCopy.zoomOutLabel}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ImageBackground source={btnCircleArrow} resizeMode="contain" style={styles.button}>
          <Text style={styles.buttonText} allowFontScaling={false}>{mapCopy.zoomOut}</Text>
        </ImageBackground>
      </Pressable>

      <Pressable
        onPress={onLocation}
        accessibilityRole="button"
        accessibilityLabel={mapCopy.locationLabel}
        disabled={locationLoading}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ImageBackground source={btnCircleTarget} resizeMode="contain" style={[styles.button, locationLoading && styles.buttonLoading]}>
          <Text style={styles.buttonText} allowFontScaling={false}>
            {locationLoading ? mapCopy.loadingIcon : ''}
          </Text>
        </ImageBackground>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack:         { position: 'absolute', bottom: 120, right: theme.space.lg, gap: theme.space.sm },
  button:        { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  buttonLoading: { opacity: 0.5 },
  buttonText:    { fontSize: 18, color: theme.colors.textPrimary, lineHeight: 22, fontWeight: 'bold' },
});
