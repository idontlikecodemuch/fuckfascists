import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { CONFIDENCE_THRESHOLD_HIGH } from '../../../config/constants';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';

// Pixel art marker assets — 96x96 source, displayed at 32pt on map
const MARKER_FLAG    = require('../../../assets/pixel/marker_flag_default.png');
const MARKER_WARN    = require('../../../assets/pixel/marker_warning_tile.png');
const MARKER_AVOIDED = require('../../../assets/pixel/marker_flag_avoided.png');

interface FlagMarkerProps {
  coordinate: { latitude: number; longitude: number };
  name: string;
  confidence: number; // 0–1 score
  avoided: boolean;
  onPress?: () => void;
}

/**
 * Pixel art map marker for a flagged (or avoided) business.
 * Uses rendered assets per component-rules §6:
 *   - Avoided: green flag with checkmark (marker_flag_avoided)
 *   - High confidence: red flag marker (marker_flag_default)
 *   - Medium confidence: warning tile (marker_warning_tile)
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
  const isHigh = confidence >= CONFIDENCE_THRESHOLD_HIGH;
  const markerSource = avoided ? MARKER_AVOIDED : isHigh ? MARKER_FLAG : MARKER_WARN;

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
      <Image source={markerSource} style={styles.marker} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 32,
    height: 32,
  },
});
