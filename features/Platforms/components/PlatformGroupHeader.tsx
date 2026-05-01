import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { SparkleDecoration } from '../../../core/fx';
import { hasSprite } from '../../../core/sprites/spriteLoader';
import { FigureBadge } from './FigureBadge';
import {
  TRACK_ROW_FACE_ANCHOR_X,
  TRACK_ROW_FACE_ANCHOR_Y,
  TRACK_ROW_FONT_SIZE_COUNT,
  TRACK_ROW_FONT_SIZE_SUBTITLE,
  TRACK_GROUP_HEADER_PADDING_VERTICAL,
  TRACK_ROW_PADDING_HORIZONTAL,
  TRACK_ROW_SPRITE_SIZE,
  TRACK_SPRITE_BUST_CROP_RATIO,
} from '../../../config/constants';

interface PlatformGroupHeaderProps {
  figureName: string;
  shortName: string;
  totalAvoids: number;
  focused: boolean;
  /** True when this header sits inside a panel that contains the focused row.
   *  Picks up the cyan tint so the cyan-bevel frame reads as one filled cell. */
  panelFocused: boolean;
  onPress: () => void;
  /** Tap handler for the inline SEE FILE link — opens the company's
   *  business card. Optional: header still works without it. */
  onSeeFile?: () => void;
}

// Avatar wraps the sprite with right + bottom dividers — same pattern as
// the PlatformRow sprite-screen plus a bottom edge (since the group header
// borders sub-rows below it). Inner FigureBadge size accounts for the
// border so the sprite stays inside the avatarFrame on every side.
const AVATAR_RIGHT_BORDER = 1;
const AVATAR_INNER_SIZE = TRACK_ROW_SPRITE_SIZE - AVATAR_RIGHT_BORDER;

export function PlatformGroupHeader({
  figureName,
  shortName,
  totalAvoids,
  focused,
  panelFocused,
  onPress,
  onSeeFile,
}: PlatformGroupHeaderProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, panelFocused && styles.panelFocusedContainer, focused && styles.focused]}
      accessibilityRole="button"
      accessibilityLabel={platformsCopy.groupHeaderA11y(shortName, totalAvoids)}
      accessibilityState={{ expanded: focused }}
    >
      <View style={styles.gradTop} pointerEvents="none" />
      <View style={styles.gradBot} pointerEvents="none" />
      {hasSprite(figureName) && (
        <View style={styles.avatarFrame}>
          <FigureBadge
            figureName={figureName}
            state="neutral"
            size={AVATAR_INNER_SIZE}
            cropRatio={TRACK_SPRITE_BUST_CROP_RATIO}
            faceAnchorX={TRACK_ROW_FACE_ANCHOR_X}
            faceAnchorY={TRACK_ROW_FACE_ANCHOR_Y}
          />
        </View>
      )}
      <View style={styles.labelColumn}>
        <View style={styles.nameRow}>
          <Text
            style={[styles.name, focused && styles.nameFocused]}
            numberOfLines={1}
            allowFontScaling
          >
            {shortName}
          </Text>
          {onSeeFile && (
            <Pressable
              onPress={onSeeFile}
              style={styles.seeFileLink}
              accessibilityRole="button"
              accessibilityLabel={platformsCopy.seeFileA11y(shortName)}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
            >
              <Ionicons
                name="folder-outline"
                size={11}
                color={theme.colors.highlightBlue}
                style={styles.seeFileIcon}
              />
              <Text style={styles.seeFileLabel} allowFontScaling>
                {platformsCopy.seeFileLabel}
              </Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.subtitle} numberOfLines={1} allowFontScaling>
          {figureName}
        </Text>
      </View>
      {totalAvoids > 0 && (
        <Text style={[styles.count, styles.countActive]} allowFontScaling>
          {platformsCopy.countLabel(totalAvoids)}
        </Text>
      )}
      {focused && <SparkleDecoration />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    // Header tracks the same row height as PlatformRow.
    minHeight: TRACK_ROW_SPRITE_SIZE,
    paddingHorizontal: TRACK_ROW_PADDING_HORIZONTAL,
    paddingVertical: TRACK_GROUP_HEADER_PADDING_VERTICAL,
    backgroundColor: theme.colors.panelInner,
    // Bottom rule separates the gradient-lit header from the sub-rows
    // below it. bevelLight reads against the panelInner / panelOuter bg
    // around it; bevelDark was nearly invisible. Color shifts to
    // focusBevelDark in a focused panel via panelFocusedContainer.
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.bevelLight,
    overflow: 'visible',
  },
  // Header inside a focused panel — picks up the same cyan fill as the rows
  // beneath it so the whole panel reads as one filled cell.
  panelFocusedContainer: {
    backgroundColor: theme.colors.trackFocusBg,
    borderBottomColor: theme.colors.focusBevelDark,
  },
  // 2-step gradient overlay — same recipe as PlatformRow's. Covers the
  // whole header (no AVOID button to exclude here).
  gradTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: '#FFFFFF',
    opacity: 0.10,
  },
  gradBot: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '35%',
    backgroundColor: '#000000',
    opacity: 0.28,
  },
  focused: {
    shadowColor: theme.glow.color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: theme.glow.dividerShadowOpacity,
    shadowRadius: theme.glow.dividerShadowRadius,
    elevation: 4,
  },
  // Cyan tint + glow + right divider — same recipe as PlatformRow's
  // spriteScreen. Adds a bottom divider unique to the group header so the
  // sprite reads as a screen with framing on the row-internal edges (right +
  // bottom) where it borders other content. Top/left are still provided by
  // the panel cap + side bevels.
  avatarFrame: {
    width: TRACK_ROW_SPRITE_SIZE,
    height: TRACK_ROW_SPRITE_SIZE,
    backgroundColor: theme.colors.trackFocusTint,
    borderRightWidth: AVATAR_RIGHT_BORDER,
    borderRightColor: theme.colors.focusAccent,
    borderBottomWidth: AVATAR_RIGHT_BORDER,
    borderBottomColor: theme.colors.focusAccent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    shadowColor: theme.glow.colorHighlight,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: theme.glow.highlightBlurRadius,
    elevation: 2,
  },
  labelColumn: {
    flex: 1,
    gap: 1,
  },
  // Inline row holding the company name + the SEE FILE link.
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  // Tappable inline link to open the company's business card. Body font,
  // smaller than the company name, with a folder icon (matches the manila
  // folder metaphor used across the app).
  seeFileLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeFileIcon: {
    marginRight: 3,
  },
  seeFileLabel: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.6,
    color: theme.colors.highlightBlue,
  },
  // Bungee at a smaller size than the default displayS — META PLATFORMS at
  // 18pt was over-shouting the row. 14pt keeps the headline voice without
  // dominating.
  name: {
    flexShrink: 1,
    fontFamily: theme.fonts.headline,
    fontSize: 14,
    lineHeight: 16,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  nameFocused: {
    color: theme.colors.highlightBlue,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: TRACK_ROW_FONT_SIZE_SUBTITLE,
    color: theme.colors.textSecondary,
  },
  // Count matches PlatformRow's count: dangerRed via countActive when shown,
  // right padding so the number sits inset from the AVOID button / panel
  // edge instead of crashing into it.
  count: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: TRACK_ROW_FONT_SIZE_COUNT,
    color: theme.colors.textSecondary,
    minWidth: 28,
    textAlign: 'right',
    paddingRight: theme.space.sm,
  },
  countActive: {
    color: theme.colors.dangerRed,
  },
});
