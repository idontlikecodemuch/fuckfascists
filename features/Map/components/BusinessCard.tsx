import React from 'react';
import { Alert, View, Text, Pressable, StyleSheet, AccessibilityInfo } from 'react-native';
import type { ScanResult } from '../types';
import type { Entity } from '../../../core/models';
import { getDisplayFigure, getParentEntity } from '../../../core/models';
import { CONFIDENCE_THRESHOLD_HIGH, CONFIDENCE_THRESHOLD_MEDIUM } from '../../../config/constants';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { bevelFocusRaised } from '../../../design/bevel';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { SparkleDecoration } from '../../../core/fx';
import { AvoidButton } from './AvoidButton';
import { DataZone } from './DataZone';

const DISMISS_HIT_SLOP = {
  top: theme.space.sm,
  bottom: theme.space.sm,
  left: theme.space.sm,
  right: theme.space.sm,
} as const;

// Re-export banner + resolve for consumers that import from BusinessCard
export { BusinessBanner, resolveCardMode } from './BusinessBanner';
export type { BannerVariant, BusinessBannerProps } from './BusinessBanner';

export interface BusinessCardProps {
  result: ScanResult;
  onAvoid: () => Promise<void>;
  /** When true, the avoid button is disabled (e.g. entity not in curated list). */
  avoidDisabled?: boolean;
  /** Whether the user has already tapped AVOIDED — controls sprite defeated state. */
  avoided?: boolean;
  onDismiss: () => void;
  /** Full entity list — enables parent attribution via getDisplayFigure/getParentEntity. */
  allEntities?: Entity[];
  modal?: boolean;
}

/** Short display name for parent attribution — strips Inc/Corp/Platforms/.com. */
function shortParentName(name: string): string {
  return name
    .replace(/\s*(Inc|Corp|Platforms|\.com)\s*/gi, '')
    .trim();
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= CONFIDENCE_THRESHOLD_HIGH) return null;
  if (confidence < CONFIDENCE_THRESHOLD_MEDIUM) return null;
  return (
    <Pressable
      onPress={() =>
        Alert.alert(mapCopy.confidenceAlertTitle, mapCopy.confidenceAlertBody)
      }
      style={styles.badge}
      accessibilityRole="button"
      accessibilityLabel={sharedCopy.confidenceA11y(sharedCopy.confidenceMedium)}
      accessibilityHint={mapCopy.confidenceBadgeHint}
    >
      <Text style={styles.badgeText}>{sharedCopy.confidenceMedium}</Text>
    </Pressable>
  );
}

/**
 * Business card — three-section layout:
 *   1. Header: sprite left + brand name / parent attribution right
 *   2. DataZone (self-contained donation data display)
 *   3. Avoid button + dismiss
 *
 * Sprite sits inside the card on the left side — no frame, no centered perch.
 * Blue chrome bevel (focusBevelLight/focusBevelDark) — card is always in the active state.
 * SparkleDecoration (large) renders when avoided.
 */
export function BusinessCard({
  result,
  onAvoid,
  avoidDisabled = false,
  avoided = false,
  onDismiss,
  allEntities,
  modal = true,
}: BusinessCardProps) {
  const { canonicalName, matchedAlias, committeeName, confidence, donationSummary, entity, fecFilingUrl } = result;

  const fecUrl = donationSummary?.fecCommitteeUrl ?? fecFilingUrl;
  const displayName = matchedAlias || canonicalName;
  const isMedium = confidence >= CONFIDENCE_THRESHOLD_MEDIUM && confidence < CONFIDENCE_THRESHOLD_HIGH;

  const parent = entity && allEntities ? getParentEntity(entity, allEntities) : undefined;
  const parentName = parent ? shortParentName(parent.canonicalName) : null;
  const showParent = parentName && parentName.toUpperCase() !== displayName.toUpperCase();

  const figureName = entity ? getDisplayFigure(entity, allEntities) : null;
  const spriteId = figureName ? nameToSpriteId(figureName) : null;
  const barcodeContext = result.context?.kind === 'barcode' ? result.context : null;
  const barcodeLabel = barcodeContext?.productName ?? barcodeContext?.brandName ?? barcodeContext?.barcode ?? null;

  const handleDetailPress = () => {
    // V1: no-op — DataZone's link opens FEC directly
  };

  const handleAvoid = async () => {
    await onAvoid();
    AccessibilityInfo.announceForAccessibility(
      mapCopy.cardAvoidedAnnouncement,
    );
  };

  return (
    <View
      style={styles.cardWrapper}
      accessibilityViewIsModal={modal}
      accessibilityLabel={mapCopy.cardModalLabel}
    >
      <View style={styles.card}>
        {/* Header: sprite left, name right */}
        <View style={styles.headerRow}>
          {spriteId && (
            <View style={styles.spriteSide} pointerEvents="none" accessibilityElementsHidden>
              <SpriteView spriteId={spriteId} state={avoided ? 'defeated' : 'neutral'} size={140} />
            </View>
          )}

          <View style={[styles.nameSide, !spriteId && styles.nameSideNoSprite]}>
            {barcodeContext && barcodeLabel && (
              <View style={styles.contextBlock}>
                <Text style={styles.contextEyebrow} allowFontScaling>
                  {mapCopy.barcodeContextEyebrow}
                </Text>
                <Text style={styles.contextLine} allowFontScaling numberOfLines={2}>
                  {mapCopy.barcodeContextLine(barcodeLabel, barcodeContext.barcode)}
                </Text>
              </View>
            )}

            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={2} accessibilityRole="header" allowFontScaling>
                {displayName}
              </Text>
              <ConfidenceBadge confidence={confidence} />
            </View>

            {showParent && (
              <Text style={styles.parentAttribution} numberOfLines={1} allowFontScaling>
                {mapCopy.parentAttribution(parentName!)}
              </Text>
            )}
          </View>
        </View>

        <DataZone
          donationSummary={donationSummary}
          committeeName={committeeName}
          fecUrl={fecUrl}
          onDetailPress={handleDetailPress}
        />

        <View style={styles.actSection}>
          <AvoidButton onPress={handleAvoid} disabled={avoidDisabled} />

          <Pressable
            onPress={onDismiss}
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel={sharedCopy.dismissLabel}
            hitSlop={DISMISS_HIT_SLOP}
          >
            <Text style={styles.dismissLabel} allowFontScaling>{sharedCopy.dismiss}</Text>
          </Pressable>
        </View>

        {avoided && <SparkleDecoration variant="large" />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: { overflow: 'visible' as const },
  card: {
    ...bevelFocusRaised,
    backgroundColor: theme.colors.panelInner,
    borderRadius: theme.radii.sharp,
    marginHorizontal: theme.space.sm,
    overflow: 'visible' as const,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  spriteSide: {
    paddingLeft: theme.space.sm,
    paddingTop: theme.space.sm,
  },
  nameSide: {
    flex: 1,
    paddingLeft: theme.space.sm,
    paddingRight: theme.space.lg,
    paddingTop: theme.space.lg,
    paddingBottom: theme.space.sm,
  },
  nameSideNoSprite: {
    paddingLeft: theme.space.lg,
  },
  contextBlock: { marginBottom: theme.space.sm },
  contextEyebrow: { ...theme.type.caption, color: theme.colors.glowCyan, letterSpacing: 1 },
  contextLine: { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: theme.space.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.space.xs },
  name: { flex: 1, ...theme.type.displayM, color: theme.colors.textPrimary, marginRight: theme.space.sm },
  parentAttribution: { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: 1 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.amberActionLight,
    backgroundColor: theme.colors.panelInner,
    borderRadius: theme.radii.sharp,
  },
  badgeText: { ...theme.type.caption, fontSize: 10, color: theme.colors.amberActionLight, fontWeight: 'bold' },
  actSection: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.md,
  },
  dismissButton: {
    alignItems: 'center',
    paddingVertical: theme.space.sm,
    marginTop: theme.space.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.focusBevelDark,
  },
  dismissLabel: { ...theme.type.bodyS, color: theme.colors.textSecondary },
});
