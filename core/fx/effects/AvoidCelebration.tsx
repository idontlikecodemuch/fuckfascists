import React, { useRef, useEffect } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { sharedCopy } from '../../../copy/shared';
import { theme } from '../../../design/tokens';
import { FX_AVOID_DURATION_MS, FX_AVOID_FADE_MS } from '../../../config/constants';
import type { FXComponentProps } from '../types';

/**
 * Full-screen checkmark celebration shown after an avoid tap.
 * Respects reduced motion: skips animation, shows static checkmark for the duration.
 */
export function AvoidCelebration({ reducedMotion, onComplete }: FXComponentProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(reducedMotion ? 1 : 0.5)).current;

  useEffect(() => {
    if (reducedMotion) {
      const timer = setTimeout(onComplete, FX_AVOID_DURATION_MS);
      return () => clearTimeout(timer);
    }

    Animated.sequence([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.delay(FX_AVOID_DURATION_MS - FX_AVOID_FADE_MS * 2),
      Animated.timing(opacity, { toValue: 0, duration: FX_AVOID_FADE_MS, useNativeDriver: true }),
    ]).start(() => onComplete());

    return undefined;
  }, [reducedMotion, onComplete, opacity, scale]);

  return (
    <Animated.View
      style={[styles.overlay, { opacity, transform: [{ scale }] }]}
      pointerEvents="none"
      accessibilityElementsHidden
    >
      <Text style={styles.checkmark}>{sharedCopy.checkmark}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    zIndex: 30,
  },
  checkmark: {
    ...theme.type.displayL,
    fontSize: 48,
    color: theme.colors.successGreen,
  },
});
