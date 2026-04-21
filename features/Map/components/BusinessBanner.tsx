import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { bevelFocusRaised } from '../../../design/bevel';
import type { BannerVariant } from './cardMode';
export { resolveCardMode } from './cardMode';
export type { BannerVariant } from './cardMode';

const BANNER_AUTO_DISMISS_MS = 5000;

export interface BusinessBannerProps {
  /** The search text or entity name that produced this banner. */
  displayName: string;
  variant: BannerVariant;
  onDismiss: () => void;
}

/** Left accent bar color per banner variant. */
function accentColor(variant: BannerVariant): string {
  switch (variant) {
    case 'dissolved': return theme.colors.amberActionLight;
    case 'lookup_failed': return theme.colors.dangerRed;
    default: return theme.colors.panelBorder;
  }
}

/**
 * Lightweight dismissible bar for non-card results.
 * No avatar, no AVOID button — informational only.
 */
export function BusinessBanner({ displayName, variant, onDismiss }: BusinessBannerProps) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const timer = setTimeout(() => onDismissRef.current(), BANNER_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  const message = (() => {
    switch (variant) {
      case 'no_match': return mapCopy.bannerNoMatch(displayName);
      case 'lookup_failed': return mapCopy.bannerLookupFailed(displayName);
      case 'no_pac': return mapCopy.bannerNoPac(displayName);
      case 'dissolved': return mapCopy.bannerDissolved(displayName);
    }
  })();

  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLabel={message}
    >
      <View style={[styles.accentBar, { backgroundColor: accentColor(variant) }]} />
      <Text style={styles.bannerText} allowFontScaling>{message}</Text>
      <Pressable
        onPress={onDismiss}
        style={styles.dismissButton}
        accessibilityRole="button"
        accessibilityLabel={sharedCopy.dismissLabel}
        accessibilityHint={mapCopy.bannerDismissLabel}
      >
        <Text style={styles.bannerDismiss} allowFontScaling>{sharedCopy.dismiss}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    ...bevelFocusRaised,
    backgroundColor: theme.colors.panelInner,
    borderRadius: theme.radii.sharp,
    marginHorizontal: theme.space.lg,
    overflow: 'hidden',
  },
  accentBar: {
    width: '100%',
    height: 3,
  },
  bannerText: {
    ...theme.type.bodyS,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.space.md,
    paddingTop: theme.space.md,
    paddingBottom: theme.space.sm,
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: theme.space.sm,
    paddingBottom: theme.space.md,
  },
  bannerDismiss: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
  },
});
