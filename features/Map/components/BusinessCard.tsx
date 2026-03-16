import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import type { ScanResult } from '../types';
import { AvoidButton } from './AvoidButton';
import type { Entity } from '../../../core/models';
import { formatDonationAmount, formatCycleLabel, formatActiveCycles, getDisplayFigure, getParentEntity } from '../../../core/models';
import { SHOW_FIGURE_NAME_IN_CARD, CONFIDENCE_THRESHOLD_HIGH } from '../../../config/constants';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
// Figure name is controlled by SHOW_FIGURE_NAME_IN_CARD (default: false).
// See CLAUDE.md §7 for the informational vs. confrontational screen split.

interface BusinessCardProps {
  result: ScanResult;
  onAvoid: () => Promise<void>;
  /** When true, the avoid button is disabled (e.g. entity not in curated list). */
  avoidDisabled?: boolean;
  onDismiss: () => void;
  /** Full entity list — enables parent attribution when an entity has a parentEntityId. */
  allEntities?: Entity[];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: number }) {
  const isVerified = level === 1.0;
  const label = isVerified ? sharedCopy.verified : sharedCopy.matched;
  return (
    <View
      style={[styles.badge, isVerified ? styles.badgeVerified : styles.badgeMatched]}
      accessibilityLabel={sharedCopy.confidenceA11y(label)}
    >
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Pixel art–styled business card shown when a flagged entity is detected.
 *
 * Design rules enforced here:
 *  - High-confidence matches show NO badge (silence means confidence).
 *  - MEDIUM matches show a MATCHED badge + "verify before acting" disclaimer.
 *  - FEC attribution link is ALWAYS shown.
 *  - Never claims more certainty than the data supports.
 *  - Recent cycle is visually prominent; historical totals are secondary.
 */
export function BusinessCard({ result, onAvoid, avoidDisabled = false, onDismiss, allEntities }: BusinessCardProps) {
  const { canonicalName, matchedAlias, committeeName, confidence, donationSummary, entity, fecFilingUrl } = result;

  // Prefer donationSummary's URL (has verified committee ID); fall back to ScanResult's fecFilingUrl.
  const fecUrl = donationSummary?.fecCommitteeUrl ?? fecFilingUrl;

  // Primary display name — the alias the user recognizes; fall back to canonicalName.
  const displayName = matchedAlias || canonicalName;

  // Secondary attribution — parent company (via parentEntityId) or canonicalName when
  // it differs from the primary display name.
  const parent = entity && allEntities ? getParentEntity(entity, allEntities) : undefined;
  const secondaryName = parent
    ? mapCopy.parentAttribution(parent.canonicalName)
    : displayName !== canonicalName
      ? canonicalName
      : null;

  // PAC committee name for data attribution line.
  const pacName = donationSummary?.committeeName ?? committeeName;

  return (
    <View style={styles.card}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text
            style={styles.name}
            numberOfLines={1}
            accessibilityRole="header"
            allowFontScaling
          >
            {displayName}
          </Text>
          {confidence < CONFIDENCE_THRESHOLD_HIGH && (
            <ConfidenceBadge level={confidence} />
          )}
        </View>

        {secondaryName && (
          <Text style={styles.parentAttribution} numberOfLines={1} allowFontScaling>
            {secondaryName}
          </Text>
        )}

        {SHOW_FIGURE_NAME_IN_CARD && entity && (
          <Text style={styles.figureName} allowFontScaling>
            {getDisplayFigure(entity, allEntities)}
          </Text>
        )}

        {confidence < CONFIDENCE_THRESHOLD_HIGH && (
          <Text style={styles.disclaimer} accessibilityRole="alert" allowFontScaling>
            {mapCopy.mediumWarning}
          </Text>
        )}
      </View>

      {/* ── Donation data (null when API unavailable) ── */}
      {donationSummary ? (
        <>
          {/* ── Recent cycle (prominent, always shown) ── */}
          <View style={styles.recentSection}>
            <Text style={[styles.recentAmount, styles.recentGOP]} allowFontScaling>
              {sharedCopy.gop} {formatDonationAmount(donationSummary.recentRepubs)}
            </Text>
            <Text style={[styles.recentAmount, styles.recentDEM]} allowFontScaling>
              {sharedCopy.dem} {formatDonationAmount(donationSummary.recentDems)}
            </Text>
            <Text style={styles.recentCycleLabel} allowFontScaling>
              in {formatCycleLabel(donationSummary.recentCycle)}
            </Text>
          </View>

          {/* ── Since 2016 totals (contextual) ── */}
          <View style={styles.totalsSection}>
            <Text style={styles.totalsRow} allowFontScaling>
              {sharedCopy.totalSince(formatDonationAmount(donationSummary.totalRepubs), formatDonationAmount(donationSummary.totalDems))}
            </Text>
            {donationSummary.activeCycles.length > 0 && (
              <Text style={styles.totalsRow} allowFontScaling>
                {sharedCopy.activeCycles(formatActiveCycles(donationSummary.activeCycles))}
              </Text>
            )}
          </View>
        </>
      ) : (
        <View style={styles.unavailableSection}>
          <Text style={styles.unavailableText} allowFontScaling>
            {sharedCopy.donationUnavail}
          </Text>
        </View>
      )}

      {/* ── PAC data attribution ── */}
      {pacName && (
        <Text style={styles.pacDataLine} numberOfLines={1} allowFontScaling>
          {mapCopy.pacDataLine(pacName)}
        </Text>
      )}

      {/* ── FEC record link ── */}
      {fecUrl && (
        <Pressable
          onPress={() => Linking.openURL(fecUrl)}
          accessibilityRole="link"
          accessibilityLabel={mapCopy.fecLinkLabel}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          style={styles.fecLinkRow}
        >
          <Text style={styles.fecLink} allowFontScaling>
            {mapCopy.fecLink}
          </Text>
        </Pressable>
      )}

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <AvoidButton onPress={onAvoid} disabled={avoidDisabled} />
        <Pressable
          onPress={onDismiss}
          style={styles.dismissButton}
          accessibilityRole="button"
          accessibilityLabel={sharedCopy.dismissLabel}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.dismissLabel} allowFontScaling>{sharedCopy.dismiss}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card:           { backgroundColor: theme.colors.surface1, borderColor: theme.colors.frameBlue, borderWidth: theme.borders.hero.width, padding: theme.space.lg, margin: theme.space.sm },
  header:         { marginBottom: theme.space.md },
  titleRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: theme.space.xs },
  name:           { flex: 1, ...theme.type.displayM, color: theme.colors.textPrimary, marginRight: theme.space.sm },
  figureName:        { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: 2 },
  parentAttribution: { ...theme.type.caption, color: theme.colors.textSecondary, marginTop: 1 },
  disclaimer:     { ...theme.type.caption, color: theme.colors.rewardYellow, marginTop: theme.space.xs },
  badge:          { paddingHorizontal: 6, paddingVertical: 2, borderWidth: theme.borders.standard.width },
  badgeVerified:  { backgroundColor: theme.colors.successGreen, borderColor: theme.colors.successGreen },
  badgeMatched:   { backgroundColor: theme.colors.rewardYellow, borderColor: theme.colors.rewardYellow },
  badgeText:      { ...theme.type.caption, fontSize: 10, color: theme.colors.bgVoid, fontWeight: 'bold' },

  // Recent cycle — visually prominent
  recentSection:     { borderTopWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, paddingTop: 10, marginBottom: 6 },
  recentAmount:      { ...theme.type.displayS, color: theme.colors.textPrimary },
  recentGOP:         { color: theme.colors.dangerRed },
  recentDEM:         { color: theme.colors.highlightBlue },
  recentCycleLabel:  { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: 2 },

  // Since 2016 totals — smaller, contextual
  totalsSection:  { marginBottom: 10 },
  totalsRow:      { ...theme.type.bodyS, color: theme.colors.textPrimary, marginBottom: 2 },

  unavailableSection: { borderTopWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, paddingTop: 10, marginBottom: 10 },
  unavailableText:    { ...theme.type.bodyS, fontSize: 13, color: theme.colors.textSecondary },

  pacDataLine:    { ...theme.type.caption, color: theme.colors.textSecondary, marginBottom: theme.space.xs },
  fecLinkRow:     { marginBottom: theme.space.md },
  fecLink:        { ...theme.type.bodyS, color: theme.colors.highlightBlue, textDecorationLine: 'underline' },

  actions:        { flexDirection: 'row', alignItems: 'center', gap: theme.space.md },
  dismissButton:  { minHeight: theme.a11y.minTapTarget, paddingVertical: 10, paddingHorizontal: theme.space.lg, borderWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, backgroundColor: theme.colors.surface2, alignItems: 'center', justifyContent: 'center' },
  dismissLabel:   { ...theme.type.bodyS, fontSize: 13, color: theme.colors.textPrimary, fontWeight: 'bold' },
});
