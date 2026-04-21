import React from 'react';
import { View, Text, Image, Linking, StyleSheet } from 'react-native';
import type { DonationSummary, PoliticalPerson } from '../../../core/models';
import { formatActiveCycles, getPersonDisplayName, makeFecIndividualUrl } from '../../../core/models';
import { CountUpAmount } from './CountUpAmount';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { sealEagleSmall } from '../../../core/ui/uiAssets';
import { deriveDonationSummary } from './dataZoneSummary';

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
  /**
   * Parent entity's canonicalName when the matched entity is a subsidiary
   * (e.g. Instagram → "Meta Platforms Inc"). When present, the card surfaces
   * a "via {Parent}" attribution line so the reader understands donation
   * lineage without having to infer it. Shown regardless of
   * SHOW_FIGURE_NAME_IN_CARD — parent linkage is informational, not
   * CEO-blaming.
   */
  parentName?: string;
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
export function DataZone({ donationSummary, committeeName, fecUrl, onDetailPress, associatedPeople, displayName, isMediumConfidence, entityName, parentName }: DataZoneProps) {
  // All donation math — totals, recent-cycle alignment, activeCycles union,
  // R>D ordering, and the hasRealDonations gate — is in deriveDonationSummary.
  // Keeps this component focused on layout and copy.
  const {
    people,
    totalR, totalD, totalO,
    recentR, recentD,
    recentCycleLabel,
    activeCycles,
    rIsLarger, recentRIsLarger,
    hasRealDonations,
  } = deriveDonationSummary(donationSummary, associatedPeople);

  const pacFullName = donationSummary?.committeeName ?? committeeName;

  return (
    <View style={styles.document}>
      {/* Decorative header */}
      <View style={styles.docHeader}>
        <Image source={sealEagleSmall} style={styles.headerSeal} />
        <Text style={styles.headerText} allowFontScaling>{mapCopy.documentHeader}</Text>
      </View>

      <View style={styles.separator} />

      {/* On file — entity name + optional confidence badge + parent attribution */}
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
          {parentName && (
            <Text style={styles.parentAttribution} numberOfLines={1} allowFontScaling>
              {mapCopy.parentAttribution(parentName)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.separator} />

      {hasRealDonations ? (
        <>
          {/* Total row — largest party first. Amounts use CountUpAmount
              for the ticker effect on card open (#126). */}
          <View style={styles.tableRow}>
            <Text style={styles.rowLabel} allowFontScaling>{mapCopy.totalRowLabel}</Text>
            <View style={styles.amountRow}>
              {rIsLarger ? (
                <>
                  <CountUpAmount value={totalR} prefix={sharedCopy.partyR} style={[styles.donationAmt, styles.colorR]} />
                  <CountUpAmount value={totalD} prefix={sharedCopy.partyD} style={[styles.donationAmt, styles.colorD]} />
                </>
              ) : (
                <>
                  <CountUpAmount value={totalD} prefix={sharedCopy.partyD} style={[styles.donationAmt, styles.colorD]} />
                  <CountUpAmount value={totalR} prefix={sharedCopy.partyR} style={[styles.donationAmt, styles.colorR]} />
                </>
              )}
              {totalO > 0 && (
                <CountUpAmount value={totalO} prefix={sharedCopy.partyO} style={[styles.donationAmt, styles.otherAmt]} />
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
                      <CountUpAmount value={recentR} prefix={sharedCopy.partyR} style={[styles.recentAmt, styles.colorR]} />
                      <CountUpAmount value={recentD} prefix={sharedCopy.partyD} style={[styles.recentAmt, styles.colorD]} />
                    </>
                  ) : (
                    <>
                      <CountUpAmount value={recentD} prefix={sharedCopy.partyD} style={[styles.recentAmt, styles.colorD]} />
                      <CountUpAmount value={recentR} prefix={sharedCopy.partyR} style={[styles.recentAmt, styles.colorR]} />
                    </>
                  )}
                </View>
              </View>
              <View style={styles.separator} />
            </>
          )}

          {/* Footnote: active cycles — union of PAC + people cycle history */}
          {activeCycles.length > 0 && (
            <View style={styles.footnoteRow}>
              <View style={styles.labelSpacer} />
              <Text style={styles.footnote} allowFontScaling>
                {sharedCopy.activeCycles(formatActiveCycles(activeCycles))}
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

      {/* Source lines — "Based on" label with inline-flowing, comma-separated
           links (PAC + associated people). Reads as one labeled list of sources
           that compose the displayed total. Inline <Text onPress> lets the items
           wrap naturally like body text; VoiceOver treats each link as its own
           focusable run. */}
      {((pacFullName && fecUrl) || people.length > 0) && (
        <View style={styles.sourceRow}>
          <Text style={styles.rowLabel} allowFontScaling>{mapCopy.basedOnLabel}</Text>
          <Text style={styles.sourceLinksFlow} allowFontScaling>
            {pacFullName && fecUrl && (
              <Text
                style={styles.sourceLink}
                onPress={() => { onDetailPress(); Linking.openURL(fecUrl); }}
                accessibilityRole="link"
                accessibilityLabel={`${pacFullName} FEC record`}
              >
                {mapCopy.sourcePrefix} {shortPacName(entityName, pacFullName)} {'\u2197'}
              </Text>
            )}
            {people.map((person, i) => {
              const lastName = extractLastName(getPersonDisplayName(person));
              const url = makeFecIndividualUrl(person);
              const needsSep = Boolean(pacFullName && fecUrl) || i > 0;
              return (
                <Text key={person.id}>
                  {needsSep && ', '}
                  <Text
                    style={styles.sourceLink}
                    onPress={() => Linking.openURL(url)}
                    accessibilityRole="link"
                    accessibilityLabel={`${lastName} ${sharedCopy.donationsLinkSuffix} FEC record`}
                  >
                    {lastName} {sharedCopy.donationsLinkSuffix} {'\u2197'}
                  </Text>
                </Text>
              );
            })}
          </Text>
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
  parentAttribution: { ...theme.type.caption, color: c.documentLabel, width: '100%', marginTop: 2 },
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
  sourceRow: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: theme.space.xs, paddingBottom: theme.space.sm },
  sourceLinksFlow: { flex: 1, ...theme.type.caption, color: c.documentLabel },
  sourceLink: { ...theme.type.caption, color: c.highlightBlue },
});
