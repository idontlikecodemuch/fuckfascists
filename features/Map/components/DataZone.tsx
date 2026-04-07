import React from 'react';
import { View, Text, Pressable, Linking, StyleSheet } from 'react-native';
import type { DonationSummary, PoliticalPerson } from '../../../core/models';
import { formatDonationAmount, formatCycleLabel, formatActiveCycles, getPersonDisplayName, makeFecIndividualUrl } from '../../../core/models';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

interface DataZoneProps {
  donationSummary: DonationSummary | null;
  /** PAC committee name — displayed when donationSummary is absent but committeeName is known. */
  committeeName: string | null;
  /** Direct link to the FEC filing page for this committee. */
  fecUrl: string | null;
  /** Called when user taps detail link. Wired to FEC link for V1. */
  onDetailPress: () => void;
  /** Associated people with individual donation data. */
  associatedPeople?: PoliticalPerson[];
}

/** Extract last name from a display name (e.g. "Jeff Bezos" → "Bezos"). */
function extractLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? fullName;
}

/** Format recent cycle line with larger party first. */
function formatRecentLine(rAmt: number, dAmt: number, cycle: string): string {
  const rStr = formatDonationAmount(rAmt);
  const dStr = formatDonationAmount(dAmt);
  const label = formatCycleLabel(Number(cycle) || 0);
  return rAmt >= dAmt
    ? `Recent (${label}): ${sharedCopy.partyR} ${rStr} \u00b7 ${sharedCopy.partyD} ${dStr}`
    : `Recent (${label}): ${sharedCopy.partyD} ${dStr} \u00b7 ${sharedCopy.partyR} ${rStr}`;
}

/**
 * Self-contained data display for the business card.
 *
 * Combines PAC donations + individual person contributions into unified totals.
 * Larger party amount is shown first and at a bigger font size.
 * Sources section links to FEC records for each data source.
 */
export function DataZone({ donationSummary, committeeName, fecUrl, onDetailPress, associatedPeople }: DataZoneProps) {
  const pacR = donationSummary?.totalRepubs ?? 0;
  const pacD = donationSummary?.totalDems ?? 0;
  const pacO = donationSummary?.totalO ?? 0;
  const recentPacR = donationSummary?.recentRepubs ?? 0;
  const recentPacD = donationSummary?.recentDems ?? 0;

  // Sum individual donations from associated people
  let personR = 0;
  let personD = 0;
  let personO = 0;
  let recentPersonR = 0;
  let recentPersonD = 0;
  for (const p of associatedPeople ?? []) {
    if (!p.donationSummary) continue;
    personR += p.donationSummary.totalR;
    personD += p.donationSummary.totalD;
    personO += p.donationSummary.totalO ?? 0;
    recentPersonR += p.donationSummary.recentCycleR;
    recentPersonD += p.donationSummary.recentCycleD;
  }

  const totalR = pacR + personR;
  const totalD = pacD + personD;
  const totalO = pacO + personO;
  const recentR = recentPacR + recentPersonR;
  const recentD = recentPacD + recentPersonD;

  const hasRealDonations = totalR !== 0 || totalD !== 0 || totalO !== 0 || recentR !== 0 || recentD !== 0;
  const pacName = donationSummary?.committeeName ?? committeeName;
  const people = (associatedPeople ?? []).filter((p) => p.donationSummary != null);
  const rIsLarger = totalR >= totalD;

  return (
    <View style={styles.zone}>
      {hasRealDonations ? (
        <>
          {/* Primary: Combined total since 2016 — larger party first + bigger */}
          <Text style={styles.totalLabel} allowFontScaling>
            {sharedCopy.totalSince2016}
          </Text>
          <View style={styles.totalRow}>
            {rIsLarger ? (
              <>
                <Text style={[styles.totalPrimary, styles.colorR]} allowFontScaling>
                  {sharedCopy.partyR} {formatDonationAmount(totalR)}
                </Text>
                <Text style={[styles.totalSecondary, styles.colorD]} allowFontScaling>
                  {sharedCopy.partyD} {formatDonationAmount(totalD)}
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.totalPrimary, styles.colorD]} allowFontScaling>
                  {sharedCopy.partyD} {formatDonationAmount(totalD)}
                </Text>
                <Text style={[styles.totalSecondary, styles.colorR]} allowFontScaling>
                  {sharedCopy.partyR} {formatDonationAmount(totalR)}
                </Text>
              </>
            )}
          </View>

          {totalO > 0 && (
            <Text style={styles.otherLine} allowFontScaling>
              {sharedCopy.partyO} {formatDonationAmount(totalO)}
            </Text>
          )}

          {/* Secondary: recent cycle — larger party first */}
          {donationSummary && (
            <Text style={styles.recentLine} allowFontScaling>
              {formatRecentLine(recentR, recentD, String(donationSummary.recentCycle))}
            </Text>
          )}

          {donationSummary && donationSummary.activeCycles.length > 0 && (
            <Text style={styles.cyclesLine} allowFontScaling>
              {sharedCopy.activeCycles(formatActiveCycles(donationSummary.activeCycles))}
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

      {/* Sources (FEC) — tappable links */}
      {(pacName || people.length > 0) && (
        <View style={styles.sourcesSection}>
          <Text style={styles.sourcesLabel} allowFontScaling>
            {sharedCopy.sourcesLabel}
          </Text>
          <View style={styles.sourcesRow}>
            {pacName && fecUrl && (
              <Pressable
                onPress={() => { onDetailPress(); Linking.openURL(fecUrl); }}
                accessibilityRole="link"
                accessibilityLabel={`${pacName} FEC record`}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={styles.sourceLink} allowFontScaling>
                  {pacName} ↗
                </Text>
              </Pressable>
            )}
            {people.map((person) => {
              const lastName = extractLastName(getPersonDisplayName(person));
              const url = makeFecIndividualUrl(person);
              return (
                <Pressable
                  key={person.id}
                  onPress={() => Linking.openURL(url)}
                  accessibilityRole="link"
                  accessibilityLabel={`${lastName} ${sharedCopy.donationsLinkSuffix} FEC record`}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                >
                  <Text style={styles.sourceLink} allowFontScaling>
                    {lastName} {sharedCopy.donationsLinkSuffix} ↗
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
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
    alignItems: 'baseline',
  },
  totalPrimary: { ...theme.type.displayM },
  totalSecondary: { ...theme.type.displayS },
  colorR: {
    color: theme.colors.dangerRed,
  },
  colorD: {
    color: theme.colors.highlightBlue,
  },
  otherLine: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    marginTop: theme.space.xs,
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
  sourcesSection: {
    marginTop: theme.space.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.focusBevelDark,
    paddingTop: theme.space.sm,
  },
  sourcesLabel: {
    ...theme.type.caption,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: theme.space.xs,
  },
  sourcesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  sourceLink: {
    ...theme.type.bodyS,
    color: theme.colors.highlightBlue,
  },
});
