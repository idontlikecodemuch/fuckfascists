import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import type { ConfidenceLevel } from '../../../core/models';

interface FlagMarkerProps {
  coordinate: { latitude: number; longitude: number };
  name: string;
  confidence: ConfidenceLevel;
  avoided: boolean;
  onPress: () => void;
}

// 8-bit palette: red = HIGH confidence flagged, amber = MEDIUM, green = avoided
const COLORS: Record<string, { bg: string; border: string }> = {
  HIGH:    { bg: '#CC0000', border: '#7A0000' },
  MEDIUM:  { bg: '#CC7A00', border: '#7A4800' },
  AVOIDED: { bg: '#228B22', border: '#0D3D16' },
};

/**
 * Pixel art–style map marker for a flagged (or avoided) business.
 * Color encodes confidence level; green overrides when the user has avoided.
 * Tapping opens the business card.
 */
export function FlagMarker({
  coordinate,
  name,
  confidence,
  avoided,
  onPress,
}: FlagMarkerProps) {
  const colors = avoided ? COLORS.AVOIDED : COLORS[confidence];

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      accessibilityLabel={
        avoided
          ? `Avoided: ${name}`
          : `Flagged business: ${name}. Confidence: ${confidence}. Tap for details.`
      }
    >
      <View
        style={[
          styles.flag,
          { backgroundColor: colors.bg, borderColor: colors.border },
        ]}
      >
        <Text style={styles.icon} accessible={false}>
          {avoided ? '\u2713' : '\u2691'}
        </Text>
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  flag: {
    width: 32,
    height: 32,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
