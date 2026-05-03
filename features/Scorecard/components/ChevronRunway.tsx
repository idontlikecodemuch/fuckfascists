import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  SCORECARD_CHEVRON_COUNT,
  SCORECARD_CHEVRON_LOOP_MS,
  SCORECARD_CHEVRON_STAGGER_MS,
} from '../../../config/constants';
import { theme } from '../../../design/tokens';

interface ChevronRunwayProps {
  width: number;
  size?: number;
  color?: string;
}

/**
 * Landing-strip chevron stack pointing up at the SHARE button.
 *
 * Sits between the card and the SHARE button. Bottom chevron pulses first,
 * then up the stack — animation flows in the direction of the user's
 * swipe-up gesture, pulling the eye toward SHARE.
 *
 * Reduced motion: chevrons hold at mid-opacity, no animation.
 */
export function ChevronRunway({
  width,
  size = 28,
  color = theme.colors.focusAccent,
}: ChevronRunwayProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const anims = useRef(
    Array.from({ length: SCORECARD_CHEVRON_COUNT }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      if (enabled) {
        setReducedMotion(true);
        anims.forEach((a) => a.setValue(0.5));
        return;
      }
      const cycleHalf = SCORECARD_CHEVRON_LOOP_MS / 2;
      anims.forEach((anim, i) => {
        // Index 0 = top chevron (closest to card). Bottom chevron pulses
        // first, so reverse the stagger.
        const delay = (SCORECARD_CHEVRON_COUNT - 1 - i) * SCORECARD_CHEVRON_STAGGER_MS;
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: cycleHalf,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: cycleHalf,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ).start();
      });
    });
    return () => {
      cancelled = true;
      anims.forEach((a) => a.stopAnimation());
    };
  }, [anims]);

  return (
    <View
      style={[styles.stack, { width }]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={{
            opacity: reducedMotion
              ? 0.5
              : anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1] }),
            transform: reducedMotion
              ? []
              : [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.05] }) }],
          }}
        >
          <Ionicons name="chevron-up" size={size} color={color} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
