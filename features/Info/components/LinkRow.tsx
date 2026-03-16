import React from 'react';
import { Text, Pressable, StyleSheet, Linking } from 'react-native';
import type { LinkEntry } from '../types';
import { infoCopy } from '../../../copy/info';
import { theme } from '../../../design/tokens';

const CATEGORY_COLORS: Record<LinkEntry['category'], string> = {
  source:    theme.colors.highlightBlue,
  community: theme.colors.successGreen,
  legal:     theme.colors.textSecondary,
};

interface LinkRowProps {
  entry: LinkEntry;
}

/**
 * Tappable link row that opens in the system browser.
 * Color-coded by category: source (blue), community (green), legal (grey).
 */
export function LinkRow({ entry }: LinkRowProps) {
  return (
    <Pressable
      onPress={() => Linking.openURL(entry.url)}
      style={styles.row}
      accessibilityRole="link"
      accessibilityLabel={infoCopy.linkLabel(entry.label)}
    >
      <Text
        style={[styles.label, { color: CATEGORY_COLORS[entry.category] }]}
        allowFontScaling
      >
        {infoCopy.linkText(entry.label)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row:   { minHeight: theme.a11y.minTapTarget, justifyContent: 'center', paddingHorizontal: theme.space.lg, paddingVertical: 10, borderBottomWidth: 1, borderColor: theme.colors.surface2 },
  label: { ...theme.type.uiLabel, fontSize: 13, textDecorationLine: 'underline' },
});
