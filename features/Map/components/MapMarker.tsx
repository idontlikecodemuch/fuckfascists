import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { CONFIDENCE_THRESHOLD_HIGH } from '../../../config/constants';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

interface FlagMarkerProps {
  coordinate: { latitude: number; longitude: number };
  name: string;
  confidence: number; // 0–1 score
  avoided: boolean;
  onPress: () => void;
}

// Token-based palette: red = HIGH confidence flagged, amber = MEDIUM, green = avoided
const COLOR_HIGH    = { bg: theme.colors.dangerRed, border: theme.colors.dangerRed };
const COLOR_MEDIUM  = { bg: theme.colors.rewardYellow, border: theme.colors.rewardYellow };
const COLOR_AVOIDED = { bg: theme.colors.successGreen, border: theme.colors.successGreen };

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
  const confidenceLabel = confidence >= CONFIDENCE_THRESHOLD_HIGH ? sharedCopy.confidenceHigh : sharedCopy.confidenceMedium;
  const colors = avoided ? COLOR_AVOIDED : (confidence >= CONFIDENCE_THRESHOLD_HIGH ? COLOR_HIGH : COLOR_MEDIUM);

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      accessibilityLabel={
        avoided
          ? mapCopy.markerAvoided(name)
          : mapCopy.markerFlagged(name, confidenceLabel)
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
    borderWidth: theme.borders.standard.width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
