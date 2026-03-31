import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import type { DonationSummary } from '../../../core/models';
import { formatDonationAmount, formatCycleLabel, formatActiveCycles } from '../../../core/models';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

interface DataZoneProps {
  donationSummary: DonationSummary | null;
  /** PAC committee name — displayed when donationSummary is absent but committeeName is known. */
  committeeName: string | null;
  /** Direct link to the FEC filing page for this committee. */
  fecUrl: string | null;
  /** Called when user taps "See full breakdown →". Wired to FEC link for V1. */
  onDetailPress: () => void;
}

/**
 * Self-contained data display for the business card.
 *
 * V1 content:
 *   - Total donations since 2016 (R + D)
 *   - Most recent cycle donations (R + D)
 *   - Active cycles list
 *   - Source attribution (PAC committee name)
 *   - FEC link
 *
 * Internals can be reworked without touching BusinessCard.
 */
export function DataZone({ donationSummary, committeeName, fecUrl, onDetailPress }: DataZoneProps) {
  const hasRealDonations = donationSummary != null &&
    (donationSummary.recentRepubs !== 0 || donationSummary.recentDems !== 0 ||
     donationSummary.totalRepubs !== 0 || donationSummary.totalDems !== 0);

  const pacName = donationSummary?.committeeName ?? committeeName;

  return (
    <View style={styles.zone}>
      {hasRealDonations ? (
        <>
          {/* Primary: Total since 2016 */}
          <Text style={styles.totalLabel} allowFontScaling>
            {sharedCopy.totalSince2016}
          </Text>
          <View style={styles.totalRow}>
            <Text style={styles.totalR} allowFontScaling>
              {sharedCopy.partyR} {formatDonationAmount(donationSummary!.totalRepubs)}
            </Text>
            <Text style={styles.totalD} allowFontScaling>
              {sharedCopy.partyD} {formatDonationAmount(donationSummary!.totalDems)}
            </Text>
          </View>

          {/* Secondary: recent cycle */}
          <Text style={styles.recentLine} allowFontScaling>
            {sharedCopy.recentCycleShort(
              formatDonationAmount(donationSummary!.recentRepubs),
              formatDonationAmount(donationSummary!.recentDems),
              formatCycleLabel(donationSummary!.recentCycle),
            )}
          </Text>

          {donationSummary!.activeCycles.length > 0 && (
            <Text style={styles.cyclesLine} allowFontScaling>
              {sharedCopy.activeCycles(formatActiveCycles(donationSummary!.activeCycles))}
            </Text>
          )}
        </>
      ) : donationSummary ? (
        <Text style={styles.unavailableText} allowFontScaling>
          {sharedCopy.donationNoneOnFile}
        </Text>
      ) : (
        <Text style={styles.unavailableText} allowFontScaling>
          {sharedCopy.donationUnavail}
        </Text>
      )}

      {pacName && (
        <Text style={styles.pacDataLine} numberOfLines={1} allowFontScaling>
          {mapCopy.pacDataLine(pacName)}
        </Text>
      )}

      {/* Footer: detail link → FEC for V1 */}
      {fecUrl && (
        <Pressable
          onPress={() => {
            onDetailPress();
            Linking.openURL(fecUrl);
          }}
          accessibilityRole="link"
          accessibilityLabel={mapCopy.dataZoneDetailLabel}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          style={styles.detailRow}
        >
          <Text style={styles.detailLink} allowFontScaling>
            {mapCopy.dataZoneDetail}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.focusBevelDark,
  },
  totalLabel: {
    ...theme.type.caption,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    paddingTop: theme.space.sm,
    marginBottom: theme.space.xs,
  },
  totalRow: {
    flexDirection: 'row',
    gap: theme.space.lg,
  },
  totalR: {
    ...theme.type.displayS,
    color: theme.colors.dangerRed,
  },
  totalD: {
    ...theme.type.displayS,
    color: theme.colors.highlightBlue,
  },
  recentLine: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    marginTop: theme.space.sm,
  },
  cyclesLine: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  unavailableText: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    paddingTop: theme.space.md,
  },
  pacDataLine: {
    ...theme.type.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.space.sm,
  },
  detailRow: {
    marginTop: theme.space.sm,
  },
  detailLink: {
    ...theme.type.bodyS,
    color: theme.colors.highlightBlue,
    textDecorationLine: 'underline',
  },
});
