import React from 'react';
import { View, Text, Image, Pressable, Linking, StyleSheet } from 'react-native';
import type { DonationSummary, PoliticalPerson } from '../../../core/models';
import { formatDonationAmount, formatCycleLabel, formatActiveCycles, getPersonDisplayName, makeFecIndividualUrl } from '../../../core/models';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { sealEagleSmall } from '../../../core/ui/uiAssets';

interface DataZoneProps {
  donationSummary: DonationSummary | null;
  committeeName: string | null;
  fecUrl: string | null;
  onDetailPress: () => void;
  associatedPeople?: PoliticalPerson[];
  displayName: string;
  isMediumConfidence: boolean;
  /** Entity canonicalName — used to derive short PAC source label. */
  entityName?: string;
}

/** Extract last name from a display name (e.g. "Jeff Bezos" → "Bezos"). */
function extractLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? fullName;
}

/** Derive short PAC name: prefer entity canonicalName stripped of suffixes, fall back to committee name. */
function shortPacName(entityName: string | undefined, committeeName: string): string {
  if (entityName) {
    return entityName.replace(/\s*(Inc\.?|Corp\.?|Platforms|\.com|LLC|Company|Co\.?)\s*/gi, '').trim();
  }
  // Fall back: strip common PAC suffixes from full committee name
  return committeeName
    .replace(/\s*(Political Action Committee|PAC|FEDERAL|FED)\s*/gi, '')
    .replace(/\s*(Inc\.?|Corp\.?)\s*/gi, '')
    .trim();
}

const LABEL_WIDTH = 56;
const AMOUNT_GAP = 10;

/**
 * Document-style data table for the manila folder business card.
 * Larger party amount always leads. No dot separators — gap only.
 */
export function DataZone({ donationSummary, committeeName, fecUrl, onDetailPress, associatedPeople, displayName, isMediumConfidence, entityName }: DataZoneProps) {
  const pacR = donationSummary?.totalRepubs ?? 0;
  const pacD = donationSummary?.totalDems ?? 0;
  const pacO = donationSummary?.totalO ?? 0;
  const recentPacR = donationSummary?.recentRepubs ?? 0;
  const recentPacD = donationSummary?.recentDems ?? 0;

  let personR = 0, personD = 0, personO = 0, recentPersonR = 0, recentPersonD = 0;
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
  const rIsLarger = totalR >= totalD;
  const recentRIsLarger = recentR >= recentD;

  const hasRealDonations = totalR !== 0 || totalD !== 0 || totalO !== 0 || recentR !== 0 || recentD !== 0;
  const pacFullName = donationSummary?.committeeName ?? committeeName;
  const people = (associatedPeople ?? []).filter((p) => p.donationSummary != null);
  const recentCycleLabel = donationSummary ? formatCycleLabel(Number(donationSummary.recentCycle) || 0) : null;

  return (
    <View style={styles.document}>
      {/* Decorative header */}
      <View style={styles.docHeader}>
        <Image source={sealEagleSmall} style={styles.headerSeal} />
        <Text style={styles.headerText} allowFontScaling>{mapCopy.documentHeader}</Text>
      </View>

      <View style={styles.separator} />

      {/* On file — entity name + optional confidence badge */}
      <View style={styles.tableRow}>
        <Text style={styles.rowLabel} allowFontScaling>{mapCopy.onFileLabel}</Text>
        <View style={styles.rowValue}>
          <Text style={styles.entityName} numberOfLines={2} accessibilityRole="header" allowFontScaling>
            {displayName}
          </Text>
          {isMediumConfidence && (
            <View style={styles.badge}>
              <Text style={styles.badgeText} allowFontScaling>{sharedCopy.warningIcon} {sharedCopy.matched}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.separator} />

      {hasRealDonations ? (
        <>
          {/* Total row — largest party first */}
          <View style={styles.tableRow}>
            <Text style={styles.rowLabel} allowFontScaling>{mapCopy.totalRowLabel}</Text>
            <View style={styles.amountRow}>
              {rIsLarger ? (
                <>
                  <Text style={[styles.donationAmt, styles.colorR]} allowFontScaling>{sharedCopy.partyR} {formatDonationAmount(totalR)}</Text>
                  <Text style={[styles.donationAmt, styles.colorD]} allowFontScaling>{sharedCopy.partyD} {formatDonationAmount(totalD)}</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.donationAmt, styles.colorD]} allowFontScaling>{sharedCopy.partyD} {formatDonationAmount(totalD)}</Text>
                  <Text style={[styles.donationAmt, styles.colorR]} allowFontScaling>{sharedCopy.partyR} {formatDonationAmount(totalR)}</Text>
                </>
              )}
              {totalO > 0 && (
                <Text style={[styles.donationAmt, styles.otherAmt]} allowFontScaling>{sharedCopy.partyO} {formatDonationAmount(totalO)}</Text>
              )}
            </View>
          </View>

          <View style={styles.separator} />

          {/* Recent cycle row — largest party first */}
          {recentCycleLabel && (
            <>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel} allowFontScaling>{recentCycleLabel}</Text>
                <View style={styles.amountRow}>
                  {recentRIsLarger ? (
                    <>
                      <Text style={[styles.recentAmt, styles.colorR]} allowFontScaling>{sharedCopy.partyR} {formatDonationAmount(recentR)}</Text>
                      <Text style={[styles.recentAmt, styles.colorD]} allowFontScaling>{sharedCopy.partyD} {formatDonationAmount(recentD)}</Text>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.recentAmt, styles.colorD]} allowFontScaling>{sharedCopy.partyD} {formatDonationAmount(recentD)}</Text>
                      <Text style={[styles.recentAmt, styles.colorR]} allowFontScaling>{sharedCopy.partyR} {formatDonationAmount(recentR)}</Text>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.separator} />
            </>
          )}

          {/* Footnote: active cycles */}
          {donationSummary && donationSummary.activeCycles.length > 0 && (
            <View style={styles.footnoteRow}>
              <View style={styles.labelSpacer} />
              <Text style={styles.footnote} allowFontScaling>
                {sharedCopy.activeCycles(formatActiveCycles(donationSummary.activeCycles))}
              </Text>
            </View>
          )}
        </>
      ) : donationSummary ? (
        <View style={styles.tableRow}>
          <Text style={styles.rowLabel} allowFontScaling>{mapCopy.totalRowLabel}</Text>
          <Text style={styles.unavailable} allowFontScaling>{sharedCopy.donationNoneOnFile}</Text>
        </View>
      ) : (
        <View style={styles.tableRow}>
          <Text style={styles.rowLabel} allowFontScaling>{mapCopy.totalRowLabel}</Text>
          <Text style={styles.unavailable} allowFontScaling>{sharedCopy.donationUnavail}</Text>
        </View>
      )}

      {/* Source line(s) — short PAC name */}
      {(pacFullName || people.length > 0) && (
        <View style={styles.sourceSection}>
          {pacFullName && fecUrl && (
            <Pressable
              onPress={() => { onDetailPress(); Linking.openURL(fecUrl); }}
              accessibilityRole="link"
              accessibilityLabel={`${pacFullName} FEC record`}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Text style={styles.sourceLink} allowFontScaling>
                {mapCopy.sourcePrefix} {shortPacName(entityName, pacFullName)} {'\u2197'}
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
                  {lastName} {sharedCopy.donationsLinkSuffix} {'\u2197'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const c = theme.colors;
const styles = StyleSheet.create({
  document: { backgroundColor: c.documentBg, paddingVertical: theme.space.sm, paddingHorizontal: theme.space.md },
  docHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: theme.space.xs, marginHorizontal: theme.space.sm },
  headerSeal: { width: 18, height: 18, tintColor: c.documentText, opacity: 0.7, marginRight: theme.space.sm },
  headerText: { fontFamily: theme.fonts.bodyMedium, fontSize: 10, letterSpacing: 2, color: c.documentText, textTransform: 'uppercase' },
  separator: { height: 1, backgroundColor: c.documentBorder, marginHorizontal: theme.space.sm },
  tableRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: theme.space.sm },
  rowLabel: { width: LABEL_WIDTH, ...theme.type.caption, color: c.documentLabel, paddingTop: 2 },
  rowValue: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.space.xs },
  entityName: { fontFamily: theme.fonts.headline, fontSize: 18, lineHeight: 22, color: c.documentText },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: c.amberActionLight, backgroundColor: c.documentBg, borderRadius: theme.radii.sharp },
  badgeText: { ...theme.type.caption, fontSize: 10, color: c.amberActionLight, fontWeight: 'bold' },
  amountRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: AMOUNT_GAP },
  donationAmt: { ...theme.type.bodyM, color: c.documentText },
  recentAmt: { ...theme.type.bodyS, color: c.documentText },
  colorR: { color: c.dangerRed },
  colorD: { color: c.highlightBlue },
  otherAmt: { color: c.documentLabel, fontSize: 12 },
  footnoteRow: { flexDirection: 'row', paddingBottom: theme.space.sm },
  labelSpacer: { width: LABEL_WIDTH },
  footnote: { ...theme.type.caption, color: c.documentLabel },
  unavailable: { flex: 1, ...theme.type.bodyS, color: c.documentLabel, fontStyle: 'italic', paddingTop: 2 },
  sourceSection: { paddingTop: theme.space.xs, paddingLeft: LABEL_WIDTH, paddingBottom: theme.space.xs, gap: theme.space.xs },
  sourceLink: { ...theme.type.caption, color: c.highlightBlue },
});
