import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

interface UnmatchedBannerProps {
  searchText: string;
  onOpenSearch: () => void;
  variant?: 'no_match' | 'lookup_unavailable';
}

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
    left: theme.space.lg,
    right: theme.space.lg,
    backgroundColor: theme.colors.surface1,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.rewardYellow,
    padding: theme.space.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  text: { ...theme.type.bodyS, color: theme.colors.textPrimary },
  link: { ...theme.type.bodyS, color: theme.colors.highlightBlue, textDecorationLine: 'underline' },
});
