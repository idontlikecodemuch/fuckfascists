import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { theme } from '../../../design/tokens';
import { glow } from '../../../design/glow';

interface CardHaloProps {
  width: number;
  height: number;
}

const PULSE_CYCLE_MS = 1800;
const INNER_INSET = 5;
const OUTER_INSET = 14;
const RING_BORDER_WIDTH = 2;
const INNER_BASE_OPACITY = 0.50;
const OUTER_BASE_OPACITY = 0.30;
const OUTER_DELAY_MS = 600;

/**
 * Card halo — strong static yellow boxShadow around the edge plus two thin
 * yellow border rings that pulse subtly, staggered. Borrows the PulseRing
 * pattern from the scan-tab CTA (border-only, ~1.01 scale) so the energy
 * reads as a breathing edge, not a growing colored box.
 *
 * Reduced motion: rings hold at mid-opacity, no scale animation.
 */
export function CardHalo({ width, height }: CardHaloProps) {
  return (
    <>
      <View
        pointerEvents="none"
        style={[styles.staticGlow, { width, height }]}
      />
      <PulseRing
        width={width}
        height={height}
        inset={INNER_INSET}
        baseOpacity={INNER_BASE_OPACITY}
        delayMs={0}
      />
      <PulseRing
        width={width}
        height={height}
        inset={OUTER_INSET}
        baseOpacity={OUTER_BASE_OPACITY}
        delayMs={OUTER_DELAY_MS}
      />
    </>
  );
}

interface PulseRingProps {
  width: number;
  height: number;
  inset: number;
  baseOpacity: number;
  delayMs: number;
}

function PulseRing({ width, height, inset, baseOpacity, delayMs }: PulseRingProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      if (enabled) {
        setReducedMotion(true);
        anim.setValue(0.5);
        return;
      }
      Animated.loop(
        Animated.sequence([
          Animated.delay(delayMs),
          Animated.timing(anim, {
            toValue: 1,
            duration: PULSE_CYCLE_MS / 2,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: PULSE_CYCLE_MS / 2,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
    return () => {
      cancelled = true;
      anim.stopAnimation();
    };
  }, [anim, delayMs]);

  const opacity = reducedMotion
    ? baseOpacity * 0.6
    : anim.interpolate({ inputRange: [0, 1], outputRange: [baseOpacity * 0.2, baseOpacity] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -inset,
        left: -inset,
        width: width + inset * 2,
        height: height + inset * 2,
        borderWidth: RING_BORDER_WIDTH,
        borderColor: theme.colors.rewardYellow,
        opacity,
      }}
    />
  );
}

const styles = StyleSheet.create({
  // Mid yellow glow around the card edges. The yellow background sits behind
  // the card image (same dimensions, no bleed), so only the boxShadow halo
  // blooms outside the card boundary.
  staticGlow: {
    position: 'absolute',
    backgroundColor: theme.colors.rewardYellow,
    boxShadow: glow(theme.colors.rewardYellow, 'mid'),
  },
});
