import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { ScanResult } from '../types';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { bevelFocusRaised } from '../../../design/bevel';

const BANNER_AUTO_DISMISS_MS = 5000;

/**
 * Banner variant — lightweight dismissible bar, no avatar, no AVOID button.
 *   no_match       — search text didn't match any FEC filing
 *   lookup_failed  — FEC API call failed
 *   no_pac         — entity matched but has no corporate PAC on file
 *   dissolved      — entity's PAC is dissolved with all-zero donation data
 */
export type BannerVariant = 'no_match' | 'lookup_failed' | 'no_pac' | 'dissolved';

export interface BusinessBannerProps {
  /** The search text or entity name that produced this banner. */
  displayName: string;
  variant: BannerVariant;
  onDismiss: () => void;
}

/**
 * Determines whether a ScanResult should render as a full card or a banner.
 *
 * FULL CARD: entity has donation data, or has a known PAC but data fetch failed.
 * BANNER: no match, lookup failed, no PAC, dissolved PAC with all-zero data.
 */
export function resolveCardMode(
  result: ScanResult,
): 'card' | { banner: BannerVariant } {
  // No entity at all — either no match or lookup failed
  if (!result.entity) {
    // If we have a committee ID, the lookup found something but entity is null
    // (matched via FEC but not in curated list) — still show card
    if (result.fecCommitteeId) return 'card';
    return { banner: 'no_match' };
  }

  const entity = result.entity;

  // Confirmed no PAC (fecCommitteeId === null)
  if (entity.fecCommitteeId === null) {
    return { banner: 'no_pac' };
  }

  // Has donation data — check for all-zeros (dissolved/empty)
  if (result.donationSummary) {
    const ds = result.donationSummary;
    const allZero = ds.recentRepubs === 0 && ds.recentDems === 0 &&
      ds.totalRepubs === 0 && ds.totalDems === 0;
    if (allZero) return { banner: 'dissolved' };
    return 'card';
  }

  // Has a PAC but no donation data fetched — show card with "unavailable" state
  if (entity.fecCommitteeId) return 'card';

  // Unverified entity with no PAC info
  return { banner: 'no_pac' };
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
