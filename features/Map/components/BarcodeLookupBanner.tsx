import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BarcodeNotice } from '../hooks/useBarcodeSearch';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

interface BarcodeLookupBannerProps {
  notice: BarcodeNotice;
  onDismiss: () => void;
}

export function BarcodeLookupBanner({ notice, onDismiss }: BarcodeLookupBannerProps) {
  const message = (() => {
    switch (notice.kind) {
      case 'unsupported':
        return mapCopy.barcodeUnsupported(notice.label);
      case 'not_in_database':
        return mapCopy.barcodeNotInDatabase(notice.label);
      case 'lookup_unavailable':
        return mapCopy.barcodeLookupFailed(notice.label);
      case 'no_match':
      default:
        return mapCopy.barcodeNoMatch(notice.label);
    }
  })();

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text} allowFontScaling>{message}</Text>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={mapCopy.bannerDismissLabel}
      >
        <Text style={styles.link} allowFontScaling>{sharedCopy.dismiss}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: theme.space['4xl'] * 2,
    left: theme.space.lg,
    right: theme.space.lg,
    backgroundColor: theme.colors.surface1,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.rewardYellow,
    padding: theme.space.md,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.a11y.minTapTarget,
  },
  text: {
    ...theme.type.bodyS,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.space.sm,
  },
  link: {
    ...theme.type.bodyS,
    color: theme.colors.highlightBlue,
    textDecorationLine: 'underline',
  },
});
