import React from 'react';
import { Text, Pressable, StyleSheet, Linking } from 'react-native';
import type { LinkEntry } from '../types';
import { infoCopy } from '../../../copy/info';
import { theme } from '../../../design/tokens';

interface LinkRowProps {
  entry: LinkEntry;
}

/**
 * Plain tappable text link — highlightBlue with ↗ suffix.
 * No panels, no borders. Generous line height for comfortable tap targets.
 */
export function LinkRow({ entry }: LinkRowProps) {
  return (
    <Pressable
      onPress={() => Linking.openURL(entry.url)}
      style={styles.row}
      accessibilityRole="link"
      accessibilityLabel={infoCopy.linkLabel(entry.label)}
    >
      <Text style={styles.label} allowFontScaling>
        {infoCopy.linkText(entry.label)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: theme.a11y.minTapTarget,
    justifyContent: 'center',
    paddingVertical: theme.space.sm,
  },
  label: {
    ...theme.type.bodyS,
    color: theme.colors.highlightBlue,
  },
});
