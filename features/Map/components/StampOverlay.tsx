import React, { useRef, useEffect, useState } from 'react';
import { Animated, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { STAMP_SLAM_MS, STAMP_OVERSHOOT } from '../../../config/constants';

interface StampOverlayProps {
  /** Called when the stamp lands at final position (for screen shake timing). */
  onLand?: () => void;
}

/**
 * "AVOIDED" stamp that slams onto the document surface.
 *
 * Animation: enters from above at 1.5× scale, springs to 1× in ~200ms
 * with slight overshoot. Red bordered text at ~8° rotation.
 * Placeholder for pixel art stamp asset — clearly coded, not final art.
 *
 * Reduced motion: static stamp, no animation.
 */
export function StampOverlay({ onLand }: StampOverlayProps) {
  const scale = useRef(new Animated.Value(STAMP_OVERSHOOT)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReducedMotion(enabled);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      scale.setValue(1);
      onLand?.();
      return;
    }

    opacity.setValue(1);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 200,
    }).start(() => {
      onLand?.();
    });
  }, [reducedMotion, opacity, scale, onLand]);

  return (
    <Animated.View
      style={[styles.stamp, { opacity, transform: [{ scale }, { rotate: '8deg' }] }]}
      pointerEvents="none"
      accessibilityElementsHidden
    >
      <Text style={styles.stampText}>{mapCopy.avoidedStamp}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: theme.colors.stampRed,
    borderRadius: theme.radii.button,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  stampText: {
    fontFamily: theme.fonts.headline,
    fontSize: 28,
    color: theme.colors.stampRed,
    letterSpacing: 4,
  },
});
