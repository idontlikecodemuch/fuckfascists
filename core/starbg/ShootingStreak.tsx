/**
 * ShootingStreak — periodic electric-blue shooting star.
 *
 * A thin glowing line that streaks across the screen at random intervals.
 * Entirely reanimated (no setTimeout) — withRepeat + withSequence + withDelay.
 * Skipped when reduced motion is enabled.
 */

import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../../design/tokens';
import {
  STARBG_STREAK_INTERVAL_MS,
  STARBG_STREAK_DURATION_MS,
  STARBG_STREAK_LENGTH,
  STARBG_SUBTLE_STREAK_INTERVAL_MS,
  STARBG_SUBTLE_STREAK_DURATION_MS,
  STARBG_SUBTLE_STREAK_LENGTH,
} from './starbgConstants';

interface ShootingStreakProps {
  screenWidth: number;
  screenHeight: number;
  reducedMotion: boolean;
  seed: number;
}

export const ShootingStreak = React.memo(function ShootingStreak({
  screenWidth,
  screenHeight,
  reducedMotion,
  seed,
}: ShootingStreakProps) {
  if (reducedMotion) return null;

  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  // Deterministic start position from seed — angle always slightly downward-right
  const startY = useRef(50 + (seed % 500) / 500 * (screenHeight * 0.6)).current;
  const angle = useRef(-15 + (seed % 11)).current; // -15 to -5 degrees

  useEffect(() => {
    // Full cycle: wait → fade in + translate → fade out → reset
    const travelDuration = STARBG_STREAK_DURATION_MS;
    const fadeIn = travelDuration * 0.15;
    const fadeOut = travelDuration * 0.25;
    const hold = travelDuration - fadeIn - fadeOut;

    opacity.value = withRepeat(
      withSequence(
        withDelay(STARBG_STREAK_INTERVAL_MS, withTiming(0.85, { duration: fadeIn })),
        withDelay(hold, withTiming(0, { duration: fadeOut })),
      ),
      -1,
    );

    progress.value = withRepeat(
      withSequence(
        withDelay(STARBG_STREAK_INTERVAL_MS, withTiming(1, {
          duration: travelDuration,
          easing: Easing.out(Easing.quad),
        })),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: progress.value * (screenWidth + STARBG_STREAK_LENGTH) - STARBG_STREAK_LENGTH },
      { rotate: `${angle}deg` },
    ],
  }));

  return (
    <Animated.View style={[styles.streak, { top: startY }, style]}>
      <Animated.View style={styles.streakCore} />
    </Animated.View>
  );
});

// ── SubtleStreak — thinner, more frequent, gradient-faded ───────────────────

interface SubtleStreakProps {
  screenWidth: number;
  screenHeight: number;
  reducedMotion: boolean;
  seed: number;
}

const SEGMENT_COUNT = 5;

export const SubtleStreak = React.memo(function SubtleStreak({
  screenWidth,
  screenHeight,
  reducedMotion,
  seed,
}: SubtleStreakProps) {
  if (reducedMotion) return null;

  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  const startY = useRef(30 + (seed % 700) / 700 * (screenHeight * 0.7)).current;
  const angle = useRef(-18 + (seed % 14)).current; // -18 to -5 degrees

  useEffect(() => {
    const dur = STARBG_SUBTLE_STREAK_DURATION_MS;
    const fadeIn = dur * 0.12;
    const fadeOut = dur * 0.30;
    const hold = dur - fadeIn - fadeOut;

    opacity.value = withRepeat(
      withSequence(
        withDelay(STARBG_SUBTLE_STREAK_INTERVAL_MS, withTiming(0.7, { duration: fadeIn })),
        withDelay(hold, withTiming(0, { duration: fadeOut })),
      ),
      -1,
    );

    progress.value = withRepeat(
      withSequence(
        withDelay(STARBG_SUBTLE_STREAK_INTERVAL_MS, withTiming(1, {
          duration: dur,
          easing: Easing.out(Easing.quad),
        })),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: progress.value * (screenWidth + STARBG_SUBTLE_STREAK_LENGTH) - STARBG_SUBTLE_STREAK_LENGTH },
      { rotate: `${angle}deg` },
    ],
  }));

  // Gradient: opacity peaks at center segment, fades to 0 at both ends
  const segWidth = STARBG_SUBTLE_STREAK_LENGTH / SEGMENT_COUNT;
  const segments = Array.from({ length: SEGMENT_COUNT }, (_, i) => {
    const t = i / (SEGMENT_COUNT - 1);       // 0 → 1
    const fade = 1 - Math.abs(t * 2 - 1);    // 0 → 1 → 0 (triangle)
    return (
      <Animated.View
        key={i}
        style={{
          width: segWidth,
          height: 0.5,
          backgroundColor: theme.colors.highlightBlue,
          opacity: fade * 0.8,
        }}
      />
    );
  });

  return (
    <Animated.View style={[subtleStyles.streak, { top: startY }, style]}>
      {segments}
    </Animated.View>
  );
});

const subtleStyles = StyleSheet.create({
  streak: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
});

const styles = StyleSheet.create({
  streak: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakCore: {
    width: 70,
    height: 1,
    borderRadius: 0.5,
    backgroundColor: theme.colors.highlightBlue,
  },
});
