import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { CONFIDENCE_THRESHOLD_HIGH } from '../../../config/constants';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

// Pixel art marker assets — 96x96 source, displayed at 32pt on map
const MARKER_FLAG    = require('../../../assets/pixel/marker_flag_default.png');
const MARKER_WARN    = require('../../../assets/pixel/marker_warning_tile.png');
const MARKER_AVOIDED = require('../../../assets/pixel/marker_flag_avoided.png');

interface FlagMarkerProps {
  coordinate: { latitude: number; longitude: number };
  name: string;
  confidence: number; // 0–1 score
  avoided: boolean;
  /**
   * False when the entity is in our database but lands on a banner
   * (no PAC + no linked donor activity, dissolved PAC, etc). The flag still
   * drops for visual coverage but renders as a grey ghost — matching the
   * style of NoMatchMarker — to signal "not actionable, no donations."
   */
  hasSignal?: boolean;
  onPress?: () => void;
}

/**
 * Pixel art map marker for a flagged (or avoided) business.
 * Uses rendered assets per component-rules §6:
 *   - Avoided: green flag with checkmark (marker_flag_avoided)
 *   - High confidence + signal: red flag marker (marker_flag_default)
 *   - Medium confidence: warning tile (marker_warning_tile)
 *   - No signal: red flag tinted grey at reduced opacity, matching NoMatchMarker
 * Tapping opens the business card or banner.
 */
export function FlagMarker({
  coordinate,
  name,
  confidence,
  avoided,
  hasSignal = true,
  onPress,
}: FlagMarkerProps) {
  const confidenceLabel = confidence >= CONFIDENCE_THRESHOLD_HIGH ? sharedCopy.confidenceHigh : sharedCopy.confidenceMedium;
  const isHigh = confidence >= CONFIDENCE_THRESHOLD_HIGH;
  const markerSource = avoided ? MARKER_AVOIDED : isHigh ? MARKER_FLAG : MARKER_WARN;
  const muted = !avoided && !hasSignal;
  const accessibilityLabel = avoided
    ? mapCopy.markerAvoided(name)
    : muted
      ? mapCopy.markerNoSignal(name)
      : mapCopy.markerFlagged(name, confidenceLabel);

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    >
      <Image source={markerSource} style={[styles.marker, muted && styles.markerMuted]} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 32,
    height: 32,
  },
  // Mirrors NoMatchMarker.ghostFlag — grey tint + 80% opacity for any
  // marker that won't open an actionable card.
  markerMuted: {
    opacity: 0.8,
    tintColor: theme.colors.textSecondary,
  },
});
