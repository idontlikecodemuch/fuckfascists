import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, AccessibilityInfo } from 'react-native';
import { Marker } from 'react-native-maps';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

const FADE_DURATION_MS = 2500;

interface NoMatchMarkerProps {
  coordinate: { latitude: number; longitude: number };
}

/**
 * Greyed-out ghost marker shown briefly at a tap location when no entity match
 * is found. Fades out over 2.5 seconds to provide visual "tap registered" feedback.
 * Respects the system reduced-motion setting — shows static then disappears.
 */
export function NoMatchMarker({ coordinate }: NoMatchMarkerProps) {
  const opacity = useRef(new Animated.Value(0.5)).current;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReducedMotion(enabled);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: FADE_DURATION_MS,
      useNativeDriver: true,
    }).start();
    return undefined;
  }, [opacity, reducedMotion]);

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      accessibilityLabel={mapCopy.tapNoMatch}
    >
      <Animated.View style={[styles.ghost, { opacity }]} />
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
  },
});
