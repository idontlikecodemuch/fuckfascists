import { useEffect, useRef } from 'react';
import { Animated, AccessibilityInfo } from 'react-native';

const CYCLE_MS = 2400;

/**
 * Looping wiggle animation for floating UI elements.
 * Gentle vertical drift, slight rotation, and scale pulse.
 *
 * Reduced motion: returns static identity transforms (no animation).
 * Uses native driver for all interpolations.
 */
export function useWiggleAnimation() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      if (enabled) {
        anim.setValue(0.5);
        return;
      }

      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: CYCLE_MS / 2,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: CYCLE_MS / 2,
            useNativeDriver: true,
          }),
        ]),
      );
      loop.start();
    });

    return () => {
      cancelled = true;
      anim.stopAnimation();
    };
  }, [anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -2.5, 0],
  });

  const rotate = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['-0.4deg', '0deg', '0.4deg', '0deg', '-0.4deg'],
  });

  const scale = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.02, 1],
  });

  return { translateY, rotate, scale };
}
