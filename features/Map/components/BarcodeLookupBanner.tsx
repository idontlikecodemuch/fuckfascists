import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BarcodeNotice } from '../hooks/useBarcodeSearch';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { haptics } from '../../../core/fx/haptics';

interface BarcodeLookupBannerProps {
  notice: BarcodeNotice;
  onDismiss: () => void;
}

/**
 * Toast for the Scan tab — surfaces OFF lookup failures, unsupported codes,
 * and "brand not in our database yet" responses.
 *
 * Per #153:
 *   - text centered
 *   - dismiss × pinned to the top-right (not inline with the body)
 *   - outside-tap dismisses via a transparent backdrop Pressable
 */
export function BarcodeLookupBanner({ notice, onDismiss }: BarcodeLookupBannerProps) {
  // Single haptic point — both backdrop and × call this handler.
  const handleDismiss = useCallback(() => {
    haptics.tap();
    onDismiss();
  }, [onDismiss]);

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
    <>
      <Pressable
        style={styles.backdrop}
        onPress={handleDismiss}
        accessibilityRole="button"
        accessibilityLabel={mapCopy.bannerDismissLabel}
      />
      <View style={styles.banner} accessibilityRole="alert" accessibilityLabel={message}>
        <Pressable
          onPress={handleDismiss}
          style={styles.dismissHit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={mapCopy.bannerDismissLabel}
        >
          <Text style={styles.dismissIcon} allowFontScaling={false}>{sharedCopy.dismissIcon}</Text>
        </Pressable>
        <Text style={styles.text} allowFontScaling>{message}</Text>
        {__DEV__ && notice.kind === 'lookup_unavailable' && notice.reason && (
          <Text
            style={styles.devReason}
            allowFontScaling={false}
            selectable
          >
            [DEV] {notice.reason}
          </Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  // Catches taps anywhere except the banner. Transparent.
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  banner: {
    position: 'absolute',
    bottom: theme.space['4xl'] * 2,
    left: theme.space.lg,
    right: theme.space.lg,
    backgroundColor: theme.colors.surface1,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.rewardYellow,
    paddingVertical: theme.space.lg,
    paddingHorizontal: theme.space.lg,
    minHeight: theme.a11y.minTapTarget,
  },
  text: {
    ...theme.type.bodyS,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  devReason: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    color: theme.colors.dangerRed,
    textAlign: 'center',
    marginTop: theme.space.xs,
    letterSpacing: 0.5,
  },
  dismissHit: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: theme.a11y.minTapTarget,
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissIcon: {
    ...theme.type.bodyM,
    color: theme.colors.textSecondary,
    fontSize: 20,
  },
});
