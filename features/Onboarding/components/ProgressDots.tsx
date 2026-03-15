import React from 'react';
import { View, StyleSheet } from 'react-native';
import { onboardCopy } from '../../../copy/onboard';

interface ProgressDotsProps {
  total: number;
  current: number; // 0-indexed
}

/**
 * Pixel art step indicator — filled square for current step, outline for others.
 */
export function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <View
      style={styles.row}
      accessibilityLabel={onboardCopy.progressStep(current + 1, total)}
      accessibilityRole="progressbar"
    >
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[styles.dot, i === current && styles.dotActive]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row:       { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot:       { width: 10, height: 10, borderWidth: 2, borderColor: '#1A1A1A', backgroundColor: 'transparent' },
  dotActive: { backgroundColor: '#CC0000', borderColor: '#CC0000' },
});
