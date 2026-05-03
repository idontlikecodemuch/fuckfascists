import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet } from 'react-native';
import { theme } from '../../../design/tokens';

interface CardHaloProps {
  width: number;
  height: number;
}

/**
 * Animated cyan + yellow glow halo behind the scorecard image.
 *
 * Pulses on reveal — borrows the visual language of the scan-tab CTA
 * (PulseRing + boxShadow stack) and the tab-bar yellow glow strip.
 *
 * Reduced motion: holds at steady mid-opacity.
 */
export function CardHalo({ width, height }: CardHaloProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      if (enabled) {
        setReducedMotion(true);
        pulse.setValue(0.5);
        return;
      }
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
    return () => {
      cancelled = true;
      pulse.stopAnimation();
    };
  }, [pulse]);

  const cyanOpacity = reducedMotion
    ? 0.5
    : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const yellowOpacity = reducedMotion
    ? 0.4
    : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.55] });
  const scale = reducedMotion
    ? 1
    : pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });

  // Inset slightly so the halo blooms outside the card edges.
  const haloStyle = { width, height, transform: [{ scale }] } as const;

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[styles.halo, styles.cyanHalo, haloStyle, { opacity: cyanOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.halo, styles.yellowHalo, haloStyle, { opacity: yellowOpacity }]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
  },
  cyanHalo: {
    backgroundColor: theme.colors.focusAccent,
    boxShadow: [
      { offsetX: 0, offsetY: 0, blurRadius: 28, spreadDistance: 8, color: 'rgba(40,120,200,0.85)' },
      { offsetX: 0, offsetY: 0, blurRadius: 64, spreadDistance: 16, color: 'rgba(40,120,200,0.45)' },
    ],
  },
  yellowHalo: {
    backgroundColor: theme.colors.rewardYellow,
    boxShadow: [
      { offsetX: 0, offsetY: 0, blurRadius: 36, spreadDistance: 10, color: 'rgba(255,201,60,0.6)' },
      { offsetX: 0, offsetY: 0, blurRadius: 80, spreadDistance: 20, color: 'rgba(255,201,60,0.25)' },
    ],
  },
});
