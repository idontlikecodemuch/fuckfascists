import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { bevelFocusRaised } from '../../../design/bevel';

interface ShareButtonProps {
  width: number;
  onPress: () => void;
}

/**
 * Glowing cyan SHARE button — the primary share affordance for the
 * scorecard trophy moment. Uses focus-bevel + cyan halo to match the
 * scan-tab CTA visual language.
 */
export function ShareButton({ width, onPress }: ShareButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.btn, { width }]}
      accessibilityRole="button"
      accessibilityLabel={scorecardCopy.shareLabel}
      accessibilityHint={scorecardCopy.shareHint}
    >
      <Text style={styles.label} allowFontScaling={false}>
        {scorecardCopy.shareBtn}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    ...bevelFocusRaised,
    backgroundColor: theme.colors.focusAccent,
    minHeight: theme.a11y.minTapTarget,
    paddingVertical: theme.space.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.button,
    boxShadow: [
      { offsetX: 0, offsetY: 0, blurRadius: 16, spreadDistance: 0, color: 'rgba(40,120,200,1)' },
      { offsetX: 0, offsetY: 0, blurRadius: 32, spreadDistance: 4, color: 'rgba(40,120,200,0.7)' },
      { offsetX: 0, offsetY: -2, blurRadius: 48, spreadDistance: 6, color: 'rgba(40,120,200,0.35)' },
    ],
  },
  label: {
    fontFamily: theme.fonts.headline,
    fontSize: 22,
    color: theme.colors.textPrimary,
    letterSpacing: 4,
  },
});
