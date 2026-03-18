import React, { useRef, useEffect } from 'react';
import { View, Text, Image, Pressable, Animated, StyleSheet, Linking } from 'react-native';
import type { ScanResult } from '../types';
import { AvoidButton } from './AvoidButton';
import type { Entity } from '../../../core/models';
import { formatDonationAmount, formatCycleLabel, formatActiveCycles, getDisplayFigure, getParentEntity } from '../../../core/models';
import { SHOW_FIGURE_NAME_IN_CARD, CONFIDENCE_THRESHOLD_HIGH } from '../../../config/constants';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';

// Pixel art assets — component-rules §1
const TOPBAND_NEUTRAL  = require('../../../assets/pixel/business_card_topband_neutral.png');
const TOPBAND_DEFEATED = require('../../../assets/pixel/business_card_topband_defeated.png');
const CORNER_TL        = require('../../../assets/pixel/corners_blue_standard_0.png');
const CORNER_TR        = require('../../../assets/pixel/corners_blue_standard_1.png');
const REWARD_OVERLAY   = require('../../../assets/pixel/business_card_reward_overlay.png');
// Figure name is controlled by SHOW_FIGURE_NAME_IN_CARD (default: false).
// See CLAUDE.md §7 for the informational vs. confrontational screen split.

interface BusinessCardProps {
  result: ScanResult;
  onAvoid: () => Promise<void>;
  /** When true, the avoid button is disabled (e.g. entity not in curated list). */
  avoidDisabled?: boolean;
  /** Whether the user has already tapped AVOIDED — controls topband + sprite state. */
  avoided?: boolean;
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
 * When sprite exists: sprite LEFT (100pt), name + parent RIGHT.
 * When no sprite: name fills full width.
 *
 * Donation hierarchy: Total since 2016 is primary (big), recent cycle secondary.
 * Global ornamentation: highlightBlue top edge, bgVoid bottom edge.
 */
export function BusinessCard({ result, onAvoid, avoidDisabled = false, avoided = false, onDismiss, allEntities }: BusinessCardProps) {
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

  // Detect all-zero donation data (e.g. dissolved PACs with no historical records).
  const hasRealDonations = donationSummary != null &&
    (donationSummary.recentRepubs !== 0 || donationSummary.recentDems !== 0 ||
     donationSummary.totalRepubs !== 0 || donationSummary.totalDems !== 0);

  const pacName = donationSummary?.committeeName ?? committeeName;

  // Resolve sprite ID from the entity's display figure
  const figureName = entity ? getDisplayFigure(entity, allEntities) : null;
  const spriteId = figureName ? nameToSpriteId(figureName) : null;

  // Reward overlay fade-in when avoided
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (avoided) {
      Animated.timing(overlayOpacity, { toValue: 0.6, duration: 400, useNativeDriver: true }).start();
    } else {
      overlayOpacity.setValue(0);
    }
  }, [avoided, overlayOpacity]);

  return (
    <View style={[styles.card, isMedium && styles.cardMedium]}>
      {/* ── Topband asset ── */}
      <Image source={avoided ? TOPBAND_DEFEATED : TOPBAND_NEUTRAL} style={styles.topband} resizeMode="cover" />
      {/* ── Corner brackets ── */}
      <Image source={CORNER_TL} style={styles.cornerTL} />
      <Image source={CORNER_TR} style={styles.cornerTR} />

      {/* ── Reward overlay — semi-transparent celebration layer ── */}
      {avoided && (
        <Animated.Image
          source={REWARD_OVERLAY}
          style={[styles.rewardOverlay, { opacity: overlayOpacity }]}
          resizeMode="cover"
          accessibilityElementsHidden
        />
      )}

      {/* ── Beat 1: WHO — sprite-left layout when sprite exists ── */}
      <View style={[styles.whoSection, spriteId ? styles.whoRow : undefined]}>
        {spriteId && (
          <View style={styles.spriteHero}>
            <SpriteView spriteId={spriteId} state={avoided ? 'defeated' : 'neutral'} size={120} />
          </View>
        )}
        <View style={spriteId ? styles.whoText : undefined}>
          <View style={styles.titleRow}>
            <Text
              style={styles.name}
              numberOfLines={2}
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
      </View>

      {/* ── Beat 2: WHY — totals primary, recent secondary ── */}
      <View style={styles.whySection}>
        {hasRealDonations ? (
          <>
            {/* Primary: Total since 2016 — big and prominent */}
            <Text style={styles.totalLabel} allowFontScaling>
              {sharedCopy.totalSince2016}
            </Text>
            <View style={styles.totalRow}>
              <Text style={styles.totalGOP} allowFontScaling>
                {sharedCopy.gop} {formatDonationAmount(donationSummary!.totalRepubs)}
              </Text>
              <Text style={styles.totalDEM} allowFontScaling>
                {sharedCopy.dem} {formatDonationAmount(donationSummary!.totalDems)}
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
  // Card container — highlight top, shadow bottom for pixel depth
  card:           { backgroundColor: theme.colors.surface1, borderColor: theme.colors.frameBlue, borderWidth: theme.borders.hero.width, borderTopColor: theme.colors.highlightBlue, borderBottomColor: theme.colors.bgVoid, margin: theme.space.sm, overflow: 'visible' as const },
  cardMedium:     { borderLeftColor: theme.colors.rewardYellow, borderLeftWidth: theme.borders.hero.width },
  topband:        { alignSelf: 'stretch' as const, height: 64 },
  cornerTL:       { position: 'absolute' as const, top: 0, left: 0, width: 32, height: 32, zIndex: 3 },
  cornerTR:       { position: 'absolute' as const, top: 0, right: 0, width: 32, height: 32, zIndex: 3 },
  rewardOverlay:  { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, zIndex: 4 },

  // Beat 1: WHO — row layout when sprite present
  whoSection:        { padding: theme.space.lg, paddingBottom: theme.space.md },
  whoRow:            { flexDirection: 'row' as const, alignItems: 'flex-start' as const },
  spriteHero:        { marginRight: theme.space.md, marginTop: -60, zIndex: 5 },
  whoText:           { flex: 1 },
  titleRow:          { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: theme.space.xs },
  name:              { flex: 1, ...theme.type.displayM, color: theme.colors.textPrimary, marginRight: theme.space.sm },
  figureName:        { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: 2 },
  parentAttribution: { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: 1 },
  disclaimer:        { ...theme.type.caption, color: theme.colors.rewardYellow, marginTop: theme.space.xs },
  badge:             { paddingHorizontal: 6, paddingVertical: 2, borderWidth: theme.borders.standard.width },
  badgeVerified:     { backgroundColor: theme.colors.successGreen, borderColor: theme.colors.successGreen },
  badgeMatched:      { backgroundColor: theme.colors.rewardYellow, borderColor: theme.colors.rewardYellow },
  badgeText:         { ...theme.type.caption, fontSize: 10, color: theme.colors.bgVoid, fontWeight: 'bold' },

  // Beat 2: WHY — totals primary
  whySection:        { paddingHorizontal: theme.space.lg, paddingBottom: theme.space.md, borderTopWidth: 1, borderTopColor: theme.colors.surface2 },
  totalLabel:        { ...theme.type.caption, color: theme.colors.textSecondary, letterSpacing: 2, paddingTop: theme.space.md, marginBottom: theme.space.xs },
  totalRow:          { flexDirection: 'row' as const, gap: theme.space.lg },
  totalGOP:          { ...theme.type.displayS, color: theme.colors.dangerRed },
  totalDEM:          { ...theme.type.displayS, color: theme.colors.highlightBlue },
  recentLine:        { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: theme.space.sm },
  cyclesLine:        { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: 2 },
  unavailableText:   { ...theme.type.bodyS, color: theme.colors.textSecondary, paddingTop: theme.space.md },
  pacDataLine:       { ...theme.type.caption, color: theme.colors.textSecondary, marginTop: theme.space.sm },
  fecLinkRow:        { marginTop: theme.space.sm },
  fecLink:           { ...theme.type.bodyS, color: theme.colors.highlightBlue, textDecorationLine: 'underline' as const },

  // Beat 3: ACT
  actSection:        { paddingHorizontal: theme.space.lg, paddingBottom: theme.space.md },

  // Dismiss
  dismissButton:     { alignItems: 'center' as const, paddingVertical: theme.space.sm, borderTopWidth: theme.borders.standard.width, borderTopColor: theme.colors.surface2 },
  dismissLabel:      { ...theme.type.bodyS, color: theme.colors.textSecondary },
});
