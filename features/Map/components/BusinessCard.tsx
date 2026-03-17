import React from 'react';
import { View, Text, Image, Pressable, StyleSheet, Linking } from 'react-native';
import type { ScanResult } from '../types';
import { AvoidButton } from './AvoidButton';
import type { Entity } from '../../../core/models';
import { formatDonationAmount, formatCycleLabel, formatActiveCycles, getDisplayFigure, getParentEntity } from '../../../core/models';
import { SHOW_FIGURE_NAME_IN_CARD, CONFIDENCE_THRESHOLD_HIGH } from '../../../config/constants';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

// Pixel art assets — component-rules §1
const TOPBAND_NEUTRAL  = require('../../../assets/pixel/business_card_topband_neutral.png');
const TOPBAND_DEFEATED = require('../../../assets/pixel/business_card_topband_defeated.png');
const CORNER_TL        = require('../../../assets/pixel/corners_blue_standard_0.png');
const CORNER_TR        = require('../../../assets/pixel/corners_blue_standard_1.png');
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
 * Three-beat business card: WHO / WHY / ACT.
 *
 * Beat 1 — WHO: matchedAlias + parent attribution + CEO name (when enabled).
 * Beat 2 — WHY: donation data with clear visual separation.
 * Beat 3 — ACT: full-width AVOID button as the primary action.
 *
 * Medium confidence: rewardYellow accent line on left border.
 */
export function BusinessCard({ result, onAvoid, avoidDisabled = false, onDismiss, allEntities }: BusinessCardProps) {
  const { canonicalName, matchedAlias, committeeName, confidence, donationSummary, entity, fecFilingUrl } = result;

  const fecUrl = donationSummary?.fecCommitteeUrl ?? fecFilingUrl;
  const displayName = matchedAlias || canonicalName;
  const isMedium = confidence < CONFIDENCE_THRESHOLD_HIGH;

  const parent = entity && allEntities ? getParentEntity(entity, allEntities) : undefined;
  const secondaryName = parent
    ? mapCopy.parentAttribution(parent.canonicalName)
    : displayName !== canonicalName
      ? canonicalName
      : null;

  const pacName = donationSummary?.committeeName ?? committeeName;

  return (
    <View style={[styles.card, isMedium && styles.cardMedium]}>
      {/* ── Topband asset ── */}
      <Image source={TOPBAND_NEUTRAL} style={styles.topband} resizeMode="cover" />
      {/* ── Corner brackets ── */}
      <Image source={CORNER_TL} style={styles.cornerTL} />
      <Image source={CORNER_TR} style={styles.cornerTR} />

      {/* ── Beat 1: WHO ── */}
      <View style={styles.whoSection}>
        <View style={styles.titleRow}>
          <Text
            style={styles.name}
            numberOfLines={1}
            accessibilityRole="header"
            allowFontScaling
          >
            {displayName}
          </Text>
          {isMedium && <ConfidenceBadge level={confidence} />}
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

        {isMedium && (
          <Text style={styles.disclaimer} accessibilityRole="alert" allowFontScaling>
            {mapCopy.mediumWarning}
          </Text>
        )}
      </View>

      {/* ── Beat 2: WHY ── */}
      <View style={styles.whySection}>
        {donationSummary ? (
          <>
            <View style={styles.recentRow}>
              <Text style={[styles.recentAmount, styles.recentGOP]} allowFontScaling>
                {sharedCopy.gop} {formatDonationAmount(donationSummary.recentRepubs)}
              </Text>
              <Text style={[styles.recentAmount, styles.recentDEM]} allowFontScaling>
                {sharedCopy.dem} {formatDonationAmount(donationSummary.recentDems)}
              </Text>
            </View>
            <Text style={styles.recentCycleLabel} allowFontScaling>
              in {formatCycleLabel(donationSummary.recentCycle)}
            </Text>

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
          <Text style={styles.unavailableText} allowFontScaling>
            {sharedCopy.donationUnavail}
          </Text>
        )}

        {pacName && (
          <Text style={styles.pacDataLine} numberOfLines={1} allowFontScaling>
            {mapCopy.pacDataLine(pacName)}
          </Text>
        )}

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
      </View>

      {/* ── Beat 3: ACT ── */}
      <View style={styles.actSection}>
        <AvoidButton onPress={onAvoid} disabled={avoidDisabled} />
      </View>

      {/* ── Dismiss ── */}
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
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card:           { backgroundColor: theme.colors.surface1, borderColor: theme.colors.frameBlue, borderWidth: theme.borders.hero.width, margin: theme.space.sm, overflow: 'hidden' as const },
  cardMedium:     { borderLeftColor: theme.colors.rewardYellow, borderLeftWidth: theme.borders.hero.width },
  topband:        { alignSelf: 'stretch' as const, height: 64 },
  cornerTL:       { position: 'absolute' as const, top: 0, left: 0, width: 32, height: 32 },
  cornerTR:       { position: 'absolute' as const, top: 0, right: 0, width: 32, height: 32 },

  // Beat 1: WHO
  whoSection:        { padding: theme.space.lg, paddingBottom: theme.space.md },
  titleRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: theme.space.xs },
  name:              { flex: 1, ...theme.type.displayM, color: theme.colors.textPrimary, marginRight: theme.space.sm },
  figureName:        { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: 2 },
  parentAttribution: { ...theme.type.caption, color: theme.colors.textSecondary, marginTop: 1 },
  disclaimer:        { ...theme.type.caption, color: theme.colors.rewardYellow, marginTop: theme.space.xs },
  badge:             { paddingHorizontal: 6, paddingVertical: 2, borderWidth: theme.borders.standard.width },
  badgeVerified:     { backgroundColor: theme.colors.successGreen, borderColor: theme.colors.successGreen },
  badgeMatched:      { backgroundColor: theme.colors.rewardYellow, borderColor: theme.colors.rewardYellow },
  badgeText:         { ...theme.type.caption, fontSize: 10, color: theme.colors.bgVoid, fontWeight: 'bold' },

  // Beat 2: WHY
  whySection:        { paddingHorizontal: theme.space.lg, paddingBottom: theme.space.md, borderTopWidth: theme.borders.standard.width, borderTopColor: theme.colors.frameBlue },
  recentRow:         { flexDirection: 'row', gap: theme.space.lg, paddingTop: theme.space.md },
  recentAmount:      { ...theme.type.displayS, color: theme.colors.textPrimary },
  recentGOP:         { color: theme.colors.dangerRed },
  recentDEM:         { color: theme.colors.highlightBlue },
  recentCycleLabel:  { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: 2 },
  totalsSection:     { marginTop: theme.space.sm },
  totalsRow:         { ...theme.type.bodyS, color: theme.colors.textPrimary, marginBottom: 2 },
  unavailableText:   { ...theme.type.bodyS, color: theme.colors.textSecondary, paddingTop: theme.space.md },
  pacDataLine:       { ...theme.type.caption, color: theme.colors.textSecondary, marginTop: theme.space.sm },
  fecLinkRow:        { marginTop: theme.space.sm },
  fecLink:           { ...theme.type.bodyS, color: theme.colors.highlightBlue, textDecorationLine: 'underline' },

  // Beat 3: ACT
  actSection:        { paddingHorizontal: theme.space.lg, paddingBottom: theme.space.md },

  // Dismiss
  dismissButton:     { alignItems: 'center', paddingVertical: theme.space.sm, borderTopWidth: theme.borders.standard.width, borderTopColor: theme.colors.surface2 },
  dismissLabel:      { ...theme.type.bodyS, color: theme.colors.textSecondary },
});
