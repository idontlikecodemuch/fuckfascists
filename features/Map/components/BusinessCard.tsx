import React from 'react';
import { View, Text, Pressable, StyleSheet, AccessibilityInfo } from 'react-native';
import type { ScanResult } from '../types';
import type { Entity } from '../../../core/models';
import { getDisplayFigure, getParentEntity } from '../../../core/models';
import { CONFIDENCE_THRESHOLD_HIGH, CONFIDENCE_THRESHOLD_MEDIUM } from '../../../config/constants';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { AvoidButton } from './AvoidButton';
import { DataZone } from './DataZone';

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
    <View
      style={styles.badge}
      accessibilityLabel={sharedCopy.confidenceA11y(sharedCopy.confidenceMedium)}
    >
      <Text style={styles.badgeText}>{sharedCopy.confidenceMedium}</Text>
    </View>
  );
}

/**
 * Business card — clean three-section layout:
 *   1. Sprite + brand name + parent attribution + confidence
 *   2. DataZone (self-contained donation data display)
 *   3. Avoid button + dismiss
 *
 * Sprite renders ABOVE the card via negative marginBottom on the perch.
 * No celebration/victory code — that lives in MapScreen (CelebrationOverlay).
 */
export function BusinessCard({
  result,
  onAvoid,
  avoidDisabled = false,
  avoided = false,
  onDismiss,
  allEntities,
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

  const handleDetailPress = () => {
    // V1: no-op — DataZone's link opens FEC directly
  };

  const handleAvoid = async () => {
    await onAvoid();
    AccessibilityInfo.announceForAccessibility(
      mapCopy.cardAvoidedAnnouncement(displayName),
    );
  };

  return (
    <View style={styles.cardWrapper} accessibilityViewIsModal accessibilityLabel={mapCopy.cardModalLabel}>
      {spriteId && (
        <View style={styles.spritePerch} pointerEvents="none" accessibilityElementsHidden>
          <SpriteView spriteId={spriteId} state={avoided ? 'defeated' : 'neutral'} size={140} />
        </View>
      )}

      <View style={[styles.card, isMedium && styles.cardMedium]}>
        <View style={styles.nameSection}>
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

          {isMedium && (
            <Text style={styles.disclaimer} accessibilityRole="alert" allowFontScaling>
              {mapCopy.mediumWarning}
            </Text>
          )}
        </View>

        <DataZone
          donationSummary={donationSummary}
          committeeName={committeeName}
          fecUrl={fecUrl}
          onDetailPress={handleDetailPress}
        />

        <View style={styles.actSection}>
          <AvoidButton onPress={handleAvoid} disabled={avoidDisabled} />
        </View>

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

const styles = StyleSheet.create({
  cardWrapper: { overflow: 'visible' as const },
  spritePerch: { alignSelf: 'center', marginBottom: -40, zIndex: 20 },
  card: {
    backgroundColor: theme.colors.surface1,
    borderColor: theme.colors.frameBlue,
    borderWidth: theme.borders.hero.width,
    borderTopColor: theme.colors.highlightBlue,
    borderBottomColor: theme.colors.bgVoid,
    marginHorizontal: theme.space.sm,
  },
  cardMedium: { borderLeftColor: theme.colors.rewardYellow, borderLeftWidth: theme.borders.hero.width },
  nameSection: { padding: theme.space.lg, paddingBottom: theme.space.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.space.xs },
  name: { flex: 1, ...theme.type.displayM, color: theme.colors.textPrimary, marginRight: theme.space.sm },
  parentAttribution: { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: 1 },
  disclaimer: { ...theme.type.caption, color: theme.colors.rewardYellow, marginTop: theme.space.xs },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: theme.borders.standard.width, backgroundColor: theme.colors.rewardYellow, borderColor: theme.colors.rewardYellow },
  badgeText: { ...theme.type.caption, fontSize: 10, color: theme.colors.bgVoid, fontWeight: 'bold' },
  actSection: { paddingHorizontal: theme.space.lg, paddingBottom: theme.space.md },
  dismissButton: { alignItems: 'center', paddingVertical: theme.space.sm, borderTopWidth: theme.borders.standard.width, borderTopColor: theme.colors.surface2 },
  dismissLabel: { ...theme.type.bodyS, color: theme.colors.textSecondary },
});
