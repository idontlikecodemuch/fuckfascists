import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { ScanResult } from '../types';
import type { PoliticalPerson } from '../../../core/models';
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
 * Unified gate: the card shows whenever we have any live donation signal —
 * from the entity's PAC OR from any linked donor/executive (associatedPeople).
 * The source doesn't matter; the question is just whether there's something
 * to show. If neither source has data, we fall through to a banner that
 * explains the most accurate reason.
 *
 * CARD: entity has donation data (PAC or people), OR matched by committee ID
 *       only, OR known PAC awaiting fetch.
 * BANNER: no match, lookup failed, confirmed no PAC + no linked people,
 *         dissolved PAC + no linked people.
 */
export function resolveCardMode(
  result: ScanResult,
  associatedPeople: PoliticalPerson[] = [],
): 'card' | { banner: BannerVariant } {
  const entity = result.entity;

  // No entity at all — either no match or matched by committee ID fallback
  if (!entity) {
    return result.fecCommitteeId ? 'card' : { banner: 'no_match' };
  }

  // Signal check — any live donation data from any source.
  // Either a PAC with non-zero activity or at least one linked person with
  // a hydrated donationSummary counts as enough to show the card.
  const pacActive = result.donationSummary != null && (
    result.donationSummary.recentRepubs !== 0 ||
    result.donationSummary.recentDems   !== 0 ||
    result.donationSummary.totalRepubs  !== 0 ||
    result.donationSummary.totalDems    !== 0
  );
  const peopleActive = associatedPeople.some((p) => {
    const ds = p.donationSummary;
    return ds != null && (ds.totalR !== 0 || ds.totalD !== 0 || (ds.totalO ?? 0) !== 0);
  });
  if (pacActive || peopleActive) return 'card';

  // No signal anywhere — pick the most accurate banner reason.
  if (result.donationSummary)         return { banner: 'dissolved' };  // PAC existed, all zero
  if (entity.fecCommitteeId === null) return { banner: 'no_pac' };     // confirmed no PAC
  if (entity.fecCommitteeId)          return 'card';                    // PAC known, data fetching
  return { banner: 'no_pac' };                                           // unverified, no PAC info
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
