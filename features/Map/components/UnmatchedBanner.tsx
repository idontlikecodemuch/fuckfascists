import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { mapCopy } from '../../../copy/map';

interface UnmatchedBannerProps {
  searchText: string;
  onOpenSearch: () => void;
  variant?: 'no_match' | 'lookup_unavailable';
}

const MONO = 'monospace' as const;
const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';

/**
 * Shown when a manual search returns no confident match, or when the lookup itself failed.
 * Tap-to-search never shows this.
 */
export function UnmatchedBanner({ searchText, onOpenSearch, variant = 'no_match' }: UnmatchedBannerProps) {
  const message = variant === 'lookup_unavailable'
    ? mapCopy.lookupFailed(searchText)
    : mapCopy.noMatch(searchText);

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text} allowFontScaling>{message}</Text>
      <Pressable
        onPress={onOpenSearch}
        accessibilityRole="link"
        accessibilityLabel={mapCopy.fecSearchLabel}
      >
        <Text style={styles.link} allowFontScaling>{mapCopy.fecSearch}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: WHITE,
    borderWidth: 3,
    borderColor: '#CC7A00',
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: { fontFamily: MONO, fontSize: 12, color: BLACK },
  link: { fontFamily: MONO, fontSize: 12, color: '#0066CC', textDecorationLine: 'underline' },
});
