import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Alert, View, Text, Pressable, Animated, PanResponder, StyleSheet, AccessibilityInfo } from 'react-native';
import type { ScanResult } from '../types';
import type { Entity, PoliticalPerson } from '../../../core/models';
import { getDisplayFigure, getParentEntity, getAssociatedPeople } from '../../../core/models';
import { CONFIDENCE_THRESHOLD_HIGH, CONFIDENCE_THRESHOLD_MEDIUM, CARD_SPRITE_SIZE, SCREEN_SHAKE_MS } from '../../../config/constants';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { AvoidButton } from './AvoidButton';
import { DataZone } from './DataZone';
import { StampOverlay } from './StampOverlay';
import { MoneyParticles } from './MoneyParticles';

// Re-export banner + resolve for consumers that import from BusinessCard
export { BusinessBanner, resolveCardMode } from './BusinessBanner';
export type { BannerVariant, BusinessBannerProps } from './BusinessBanner';

export interface BusinessCardProps {
  result: ScanResult;
  onAvoid: () => Promise<void>;
  avoidDisabled?: boolean;
  avoided?: boolean;
  onDismiss: () => void;
  allEntities?: Entity[];
  people?: PoliticalPerson[];
  modal?: boolean;
  /** Set to true when the post-avoid animation is playing. */
  avoidAnimating?: boolean;
}

/** Strip Inc/Corp/Platforms/.com for parent name display. */
function shortParentName(name: string): string {
  return name.replace(/\s*(Inc|Corp|Platforms|\.com)\s*/gi, '').trim();
}

/**
 * Manila folder business card — Clark pulling a file.
 *
 * Layout:
 *   Folder (full-width manila) → folder tab (REPORT ×) top-right
 *   → red seal (decorative) → cream document panel → DataZone table
 *   → AvoidButton → sprite perching on document top edge.
 *
 * Dismiss: folder tab tap, backdrop tap (in MapScreen), swipe down.
 */
export function BusinessCard({
  result, onAvoid, avoidDisabled = false, avoided = false,
  onDismiss, allEntities, people, modal = true, avoidAnimating = false,
}: BusinessCardProps) {
  const { canonicalName, matchedAlias, committeeName, confidence, donationSummary, entity, fecFilingUrl } = result;

  const fecUrl = donationSummary?.fecCommitteeUrl ?? fecFilingUrl;
  const displayName = matchedAlias || canonicalName;
  const isMedium = confidence >= CONFIDENCE_THRESHOLD_MEDIUM && confidence < CONFIDENCE_THRESHOLD_HIGH;

  const parent = entity && allEntities ? getParentEntity(entity, allEntities) : undefined;
  const parentName = parent ? shortParentName(parent.canonicalName) : null;
  const showParent = parentName && parentName.toUpperCase() !== displayName.toUpperCase();
  // When brand ≈ parent, show only brand name (no parent inline)
  const effectiveDisplayName = showParent ? displayName : displayName;

  const figureName = entity ? getDisplayFigure(entity, allEntities) : null;
  const spriteId = figureName ? nameToSpriteId(figureName) : null;
  const associatedPeople = entity && people ? getAssociatedPeople(entity, people, allEntities) : [];

  const handleDetailPress = () => {};

  const handleAvoid = async () => {
    await onAvoid();
    AccessibilityInfo.announceForAccessibility(mapCopy.cardAvoidedAnnouncement);
  };

  // ── Screen shake ───────────────────────────────────────────────────────────
  const shakeX = useRef(new Animated.Value(0)).current;
  const shakeY = useRef(new Animated.Value(0)).current;

  const triggerShake = () => {
    const seq = [1, -1, 1, -1, 0].map((dir) =>
      Animated.timing(shakeX, { toValue: dir * 2, duration: SCREEN_SHAKE_MS / 5, useNativeDriver: true }),
    );
    Animated.parallel([
      Animated.sequence(seq),
      Animated.sequence([1, -1, 0].map((dir) =>
        Animated.timing(shakeY, { toValue: dir * 1, duration: SCREEN_SHAKE_MS / 3, useNativeDriver: true }),
      )),
    ]).start();
  };

  // ── Swipe-down dismiss (follow finger) ─────────────────────────────────────
  const translateY = useRef(new Animated.Value(0)).current;

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, g) => g.dy > 10 && g.dy > Math.abs(g.dx),
    onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
    onPanResponderRelease: (_, g) => {
      if (g.dy > 80 || g.vy > 0.5) {
        Animated.spring(translateY, { toValue: 600, useNativeDriver: true, friction: 8 }).start(onDismiss);
      } else {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  }), [onDismiss, translateY]);

  return (
    <Animated.View
      style={[styles.folder, { transform: [{ translateX: shakeX }, { translateY: Animated.add(translateY, shakeY) }] }]}
      accessibilityViewIsModal={modal}
      accessibilityLabel={mapCopy.cardModalLabel}
      {...panResponder.panHandlers}
    >
      {/* Folder tab — dismiss target */}
      <Pressable
        onPress={onDismiss}
        style={styles.folderTab}
        accessibilityRole="button"
        accessibilityLabel={mapCopy.closeReportA11y}
      >
        <Text style={styles.tabLabel} allowFontScaling>{mapCopy.reportTabLabel}</Text>
        <Text style={styles.tabClose} allowFontScaling>{mapCopy.reportTabClose}</Text>
      </Pressable>

      {/* Red seal — decorative, partially behind document */}
      <View style={styles.seal} pointerEvents="none" accessibilityElementsHidden />

      {/* Sprite — perching on document */}
      {spriteId && (
        <View style={styles.spritePerch} pointerEvents="none" accessibilityElementsHidden>
          <SpriteView spriteId={spriteId} state={avoided ? 'defeated' : 'neutral'} size={CARD_SPRITE_SIZE} />
        </View>
      )}

      {/* Document panel */}
      <View style={styles.documentPanel}>
        <DataZone
          donationSummary={donationSummary}
          committeeName={committeeName}
          fecUrl={fecUrl}
          onDetailPress={handleDetailPress}
          associatedPeople={associatedPeople}
          displayName={effectiveDisplayName}
          isMediumConfidence={isMedium}
        />

        <View style={styles.buttonPad}>
          <AvoidButton onPress={handleAvoid} disabled={avoidDisabled} initialConfirmed={avoided} />
        </View>

        {/* Post-avoid stamp overlay */}
        {avoidAnimating && <StampOverlay onLand={triggerShake} />}
      </View>

      {/* Post-avoid money particles */}
      {avoidAnimating && <MoneyParticles originY={-CARD_SPRITE_SIZE * 0.5} />}
    </Animated.View>
  );
}

const SPRITE_OVERLAP = Math.round(CARD_SPRITE_SIZE * 0.2);
const SPRITE_ABOVE = CARD_SPRITE_SIZE - SPRITE_OVERLAP;

const styles = StyleSheet.create({
  folder: {
    backgroundColor: theme.colors.folderBg,
    overflow: 'visible' as const,
    paddingBottom: theme.space.lg,
  },
  folderTab: {
    position: 'absolute',
    top: -36,
    right: theme.space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.folderTabBg,
    borderTopLeftRadius: theme.radii.folderTab,
    borderTopRightRadius: theme.radii.folderTab,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    minWidth: theme.a11y.minTapTarget,
    minHeight: theme.a11y.minTapTarget,
    zIndex: 5,
  },
  tabLabel: {
    fontFamily: theme.fonts.headline,
    fontSize: 12,
    color: theme.colors.documentText,
    letterSpacing: 1,
    marginRight: theme.space.sm,
  },
  tabClose: {
    fontFamily: theme.fonts.headline,
    fontSize: 16,
    color: theme.colors.documentText,
    opacity: 0.6,
  },
  seal: {
    position: 'absolute',
    right: theme.space.xl,
    top: theme.space['2xl'],
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.sealRed,
    opacity: 0.25,
    zIndex: 1,
  },
  spritePerch: {
    position: 'absolute',
    left: theme.space.lg,
    top: -(SPRITE_ABOVE),
    zIndex: 4,
  },
  documentPanel: {
    marginHorizontal: theme.space.lg,
    marginTop: theme.space.sm,
    borderRadius: theme.radii.sharp,
    overflow: 'hidden',
    backgroundColor: theme.colors.documentBg,
    zIndex: 2,
  },
  buttonPad: {
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    backgroundColor: theme.colors.documentBg,
  },
});
