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
  /** Entity display name for the "On file" row. */
  displayName: string;
  /** Whether to show the medium-confidence badge inline. */
  isMediumConfidence: boolean;
}

/** Extract last name from a display name (e.g. "Jeff Bezos" → "Bezos"). */
function extractLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] ?? fullName;
}

const LABEL_WIDTH = 56;

/**
 * Document-style data table for the manila folder business card.
 *
 * Renders inside a cream document panel. All donation math is identical
 * to the previous freeform layout — only the rendering changed.
 */
export function DataZone({ donationSummary, committeeName, fecUrl, onDetailPress, associatedPeople, displayName, isMediumConfidence }: DataZoneProps) {
  const pacR = donationSummary?.totalRepubs ?? 0;
  const pacD = donationSummary?.totalDems ?? 0;
  const pacO = donationSummary?.totalO ?? 0;
  const recentPacR = donationSummary?.recentRepubs ?? 0;
  const recentPacD = donationSummary?.recentDems ?? 0;

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
          {/* Total row */}
          <View style={styles.tableRow}>
            <Text style={styles.rowLabel} allowFontScaling>{mapCopy.totalRowLabel}</Text>
            <View style={styles.rowValue}>
              <Text style={styles.donationLine} allowFontScaling>
                <Text style={styles.colorR}>{sharedCopy.partyR} {formatDonationAmount(totalR)}</Text>
                <Text style={styles.dotSep}> {'\u00b7'} </Text>
                <Text style={styles.colorD}>{sharedCopy.partyD} {formatDonationAmount(totalD)}</Text>
                {totalO > 0 && (
                  <>
                    <Text style={styles.dotSep}> {'\u00b7'} </Text>
                    <Text style={styles.otherAmt}>{sharedCopy.partyO} {formatDonationAmount(totalO)}</Text>
                  </>
                )}
              </Text>
            </View>
          </View>

          <View style={styles.separator} />

          {/* Recent cycle row */}
          {recentCycleLabel && (
            <>
              <View style={styles.tableRow}>
                <Text style={styles.rowLabel} allowFontScaling>{recentCycleLabel}</Text>
                <View style={styles.rowValue}>
                  <Text style={styles.recentLine} allowFontScaling>
                    <Text style={styles.colorR}>{sharedCopy.partyR} {formatDonationAmount(recentR)}</Text>
                    <Text style={styles.dotSep}> {'\u00b7'} </Text>
                    <Text style={styles.colorD}>{sharedCopy.partyD} {formatDonationAmount(recentD)}</Text>
                  </Text>
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

      {/* Source line(s) */}
      {(pacName || people.length > 0) && (
        <View style={styles.sourceSection}>
          {pacName && fecUrl && (
            <Pressable
              onPress={() => { onDetailPress(); Linking.openURL(fecUrl); }}
              accessibilityRole="link"
              accessibilityLabel={`${pacName} FEC record`}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Text style={styles.sourceLink} allowFontScaling>
                {mapCopy.sourcePrefix} {pacName} {'\u2197'}
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
  docHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: theme.space.xs },
  headerSeal: { width: 14, height: 14, tintColor: c.documentText, opacity: 0.6, marginRight: theme.space.sm },
  headerText: { fontFamily: theme.fonts.bodyMedium, fontSize: 10, letterSpacing: 2, color: c.documentText, textTransform: 'uppercase' },
  separator: { height: 1, backgroundColor: c.documentBorder },
  tableRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: theme.space.sm },
  rowLabel: { width: LABEL_WIDTH, ...theme.type.caption, color: c.documentLabel, paddingTop: 2 },
  rowValue: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.space.xs },
  entityName: { fontFamily: theme.fonts.headline, fontSize: 18, lineHeight: 22, color: c.documentText },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: c.amberActionLight, backgroundColor: c.documentBg, borderRadius: theme.radii.sharp },
  badgeText: { ...theme.type.caption, fontSize: 10, color: c.amberActionLight, fontWeight: 'bold' },
  donationLine: { ...theme.type.bodyM, color: c.documentText },
  recentLine: { ...theme.type.bodyS, color: c.documentText },
  colorR: { color: c.dangerRed },
  colorD: { color: c.highlightBlue },
  dotSep: { color: c.documentLabel },
  otherAmt: { color: c.documentLabel, fontSize: 12 },
  footnoteRow: { flexDirection: 'row', paddingBottom: theme.space.sm },
  labelSpacer: { width: LABEL_WIDTH },
  footnote: { ...theme.type.caption, color: c.documentLabel },
  unavailable: { flex: 1, ...theme.type.bodyS, color: c.documentLabel, fontStyle: 'italic', paddingTop: 2 },
  sourceSection: { paddingTop: theme.space.xs, paddingLeft: LABEL_WIDTH, paddingBottom: theme.space.xs, gap: theme.space.xs },
  sourceLink: { ...theme.type.caption, color: c.highlightBlue },
});
