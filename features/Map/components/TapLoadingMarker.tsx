import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, StyleSheet, AccessibilityInfo } from 'react-native';
import { Marker } from 'react-native-maps';

interface TapLoadingMarkerProps {
  coordinate: { latitude: number; longitude: number };
}

/**
 * Subtle pulsing dot shown at the tap coordinate while POI search is in flight.
 * Respects the system reduced-motion setting — static when enabled.
 */
export function TapLoadingMarker({ coordinate }: TapLoadingMarkerProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
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
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.25, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim, reducedMotion]);

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      accessibilityLabel="Searching nearby businesses"
    >
      <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#CC7A00',
    borderWidth: 2,
    borderColor: '#7A4800',
  },
});
