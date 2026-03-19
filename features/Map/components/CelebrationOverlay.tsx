import React, { useRef, useEffect } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { sharedCopy } from '../../../copy/shared';
import { theme } from '../../../design/tokens';

export interface CelebrationEffect {
  id: string;
  type: 'avoid';
  startedAt: number;
}

export const CELEBRATION_DURATION_MS = 3000;

/**
 * Screen-level celebration effect rendered over the card area.
 * Keyed by type so new effects can be added easily.
 * Respects reduced motion: animation disabled, static checkmark shown instead.
 */
export function CelebrationOverlay({ effect, reducedMotion, onComplete }: {
  effect: CelebrationEffect;
  reducedMotion: boolean;
  onComplete: () => void;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(reducedMotion ? 1 : 0.5)).current;

  useEffect(() => {
    if (reducedMotion) {
      const timer = setTimeout(onComplete, CELEBRATION_DURATION_MS);
      return () => clearTimeout(timer);
    }

    // Animate: scale up + hold + fade out
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 5 }),
      Animated.delay(CELEBRATION_DURATION_MS - 800),
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
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
