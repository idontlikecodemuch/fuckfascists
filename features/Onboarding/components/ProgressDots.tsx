import React from 'react';
import { View, StyleSheet } from 'react-native';
import { onboardCopy } from '../../../copy/onboard';
import { theme } from '../../../design/tokens';
import { bevelInset, bevelAmberRaised, bevelFocusRaised } from '../../../design/bevel';

interface ProgressDotsProps {
  total: number;
  current: number; // 0-indexed
}

/**
 * Pixel art step indicator — beveled squares.
 * Upcoming: grey inset bevel, panelOuter fill.
 * Active: amber raised bevel, rewardYellow fill.
 * Completed: blue raised bevel, focusAccent fill.
 */
export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <View
      style={styles.row}
      accessibilityLabel={onboardCopy.progressStep(current + 1, total)}
      accessibilityRole="progressbar"
    >
      {Array.from({ length: total }, (_, i) => {
        const isActive = i === current;
        const isCompleted = i < current;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              isCompleted ? styles.dotCompleted : isActive ? styles.dotActive : styles.dotUpcoming,
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: theme.space.sm, alignItems: 'center' },
  dot: { width: 10, height: 10 },
  dotUpcoming: {
    ...bevelInset,
    backgroundColor: theme.colors.panelOuter,
  },
  dotActive: {
    ...bevelAmberRaised,
    backgroundColor: theme.colors.rewardYellow,
  },
  dotCompleted: {
    ...bevelFocusRaised,
    backgroundColor: theme.colors.focusAccent,
  },
});
