import React from 'react';
import { Text, Pressable, StyleSheet, Linking } from 'react-native';
import type { LinkEntry } from '../types';

const CATEGORY_COLORS: Record<LinkEntry['category'], string> = {
  source:    '#0066CC',
  community: '#228B22',
  legal:     '#888888',
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
      accessibilityLabel={`${entry.label} — opens in browser`}
    >
      <Text
        style={[styles.label, { color: CATEGORY_COLORS[entry.category] }]}
        allowFontScaling
      >
        {entry.label} ↗
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row:   { minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderColor: '#DDD' },
  label: { fontFamily: 'monospace', fontSize: 13, textDecorationLine: 'underline' },
});
