import React, { useRef, useMemo } from 'react';
import { View, Text, Image, Pressable, Animated, PanResponder, StyleSheet, AccessibilityInfo } from 'react-native';
import type { ScanResult } from '../types';
import type { Entity, PoliticalPerson } from '../../../core/models';
import { getDisplayFigure, getAssociatedPeople } from '../../../core/models';
import { CONFIDENCE_THRESHOLD_HIGH, CONFIDENCE_THRESHOLD_MEDIUM, CARD_SPRITE_SIZE, SCREEN_SHAKE_MS } from '../../../config/constants';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { sealEagle } from '../../../core/ui/uiAssets';
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
  avoidAnimating?: boolean;
}

/**
 * Manila folder business card — Clark pulling a file.
 *
 * Folder (gradient manila) → folder tab (REPORT ×) → red seal (decorative)
 * → cream document panel (with drop shadow) → DataZone table → AvoidButton
 * → sprite perching on document top edge.
 */
export function BusinessCard({
  result, onAvoid, avoidDisabled = false, avoided = false,
  onDismiss, allEntities, people, modal = true, avoidAnimating = false,
}: BusinessCardProps) {
  const { canonicalName, matchedAlias, committeeName, confidence, donationSummary, entity, fecFilingUrl } = result;

  const fecUrl = donationSummary?.fecCommitteeUrl ?? fecFilingUrl;
  const displayName = matchedAlias || canonicalName;
  const isMedium = confidence >= CONFIDENCE_THRESHOLD_MEDIUM && confidence < CONFIDENCE_THRESHOLD_HIGH;

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
      {/* Folder gradient layers */}
      <View style={styles.folderGradTop} />
      <View style={styles.folderGradBot} />

      {/* Folder tab — dismiss target. Overlay mirrors folderGradTop so the
           tab matches the lightened top of the folder body at the seam. */}
      <Pressable
        onPress={onDismiss}
        style={styles.folderTab}
        accessibilityRole="button"
        accessibilityLabel={mapCopy.closeReportA11y}
      >
        <View style={styles.folderTabOverlay} pointerEvents="none" />
        <Text style={styles.tabLabel} allowFontScaling>{mapCopy.reportTabLabel}</Text>
        <Text style={styles.tabClose} allowFontScaling>{mapCopy.reportTabClose}</Text>
      </Pressable>

      {/* Red seal — decorative */}
      <Image source={sealEagle} style={styles.seal} accessibilityElementsHidden />

      {/* Sprite — perching on document */}
      {spriteId && (
        <View style={styles.spritePerch} pointerEvents="none" accessibilityElementsHidden>
          <SpriteView spriteId={spriteId} state={avoided ? 'defeated' : 'neutral'} size={CARD_SPRITE_SIZE} />
        </View>
      )}

      {/* Document panel with drop shadow */}
      <View style={styles.documentShadow}>
        <View style={styles.documentPanel}>
          <DataZone
            donationSummary={donationSummary}
            committeeName={committeeName}
            fecUrl={fecUrl}
            onDetailPress={handleDetailPress}
            associatedPeople={associatedPeople}
            displayName={displayName}
            isMediumConfidence={isMedium}
            entityName={entity?.canonicalName}
          />

          <View style={styles.buttonPad}>
            <AvoidButton onPress={handleAvoid} disabled={avoidDisabled} initialConfirmed={avoided} />
          </View>

          {/* Post-avoid stamp overlay */}
          {avoidAnimating && <StampOverlay onLand={triggerShake} />}
        </View>
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
    paddingTop: theme.space.sm,
  },
  folderGradTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: theme.colors.folderBgLight,
    opacity: 0.5,
  },
  folderGradBot: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: theme.colors.folderBgDark,
    opacity: 0.4,
  },
  folderTab: {
    position: 'absolute',
    top: -36,
    right: theme.space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.folderBg,
    borderTopLeftRadius: theme.radii.folderTab,
    borderTopRightRadius: theme.radii.folderTab,
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    minWidth: theme.a11y.minTapTarget,
    minHeight: theme.a11y.minTapTarget,
    zIndex: 5,
    overflow: 'hidden',
  },
  folderTabOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.folderBgLight,
    opacity: 0.5,
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
    right: -4,
    top: theme.space.lg,
    width: 80,
    height: 80,
    tintColor: theme.colors.sealRed,
    opacity: 0.3,
    zIndex: 3,
  },
  spritePerch: {
    position: 'absolute',
    left: theme.space.lg,
    top: -(SPRITE_ABOVE),
    zIndex: 4,
  },
  documentShadow: {
    marginHorizontal: theme.space.lg,
    marginTop: theme.space.sm,
    shadowColor: theme.colors.documentShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2,
  },
  documentPanel: {
    borderRadius: theme.radii.sharp,
    overflow: 'hidden',
    backgroundColor: theme.colors.documentBg,
  },
  buttonPad: {
    paddingHorizontal: theme.space.md,
    paddingVertical: theme.space.sm,
    backgroundColor: 'transparent',
  },
});
