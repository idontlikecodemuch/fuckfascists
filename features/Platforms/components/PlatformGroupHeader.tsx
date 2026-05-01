import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { bevelRaised, bevelFocusRaised } from '../../../design/bevel';
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
}

export function PlatformGroupHeader({
  figureName,
  shortName,
  totalAvoids,
  focused,
  panelFocused,
  onPress,
}: PlatformGroupHeaderProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, panelFocused && styles.panelFocusedContainer, focused && styles.focused]}
      accessibilityRole="button"
      accessibilityLabel={platformsCopy.groupHeaderA11y(shortName, totalAvoids)}
      accessibilityState={{ expanded: focused }}
    >
      {hasSprite(figureName) && (
        <View style={[styles.avatarFrame, focused && styles.avatarFrameFocused]}>
          <FigureBadge
            figureName={figureName}
            state="neutral"
            size={TRACK_ROW_SPRITE_SIZE}
            cropRatio={TRACK_SPRITE_BUST_CROP_RATIO}
            faceAnchorX={TRACK_ROW_FACE_ANCHOR_X}
            faceAnchorY={TRACK_ROW_FACE_ANCHOR_Y}
          />
        </View>
      )}
      <View style={styles.labelColumn}>
        <Text style={[styles.name, focused && styles.nameFocused]} numberOfLines={1} allowFontScaling>
          {shortName}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1} allowFontScaling>
          {figureName}
        </Text>
      </View>
      {totalAvoids > 0 && (
        <Text style={[styles.count, focused && styles.countFocused]} allowFontScaling>
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
    minHeight: theme.a11y.minTapTarget,
    paddingHorizontal: TRACK_ROW_PADDING_HORIZONTAL,
    paddingVertical: TRACK_GROUP_HEADER_PADDING_VERTICAL,
    backgroundColor: theme.colors.panelInner,
    overflow: 'visible',
  },
  // Header inside a focused panel — picks up the same cyan fill as the rows
  // beneath it so the whole panel reads as one filled cell.
  panelFocusedContainer: {
    backgroundColor: theme.colors.trackFocusBg,
  },
  focused: {
    shadowColor: theme.glow.color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: theme.glow.dividerShadowOpacity,
    shadowRadius: theme.glow.dividerShadowRadius,
    elevation: 4,
  },
  avatarFrame: {
    ...bevelRaised,
    backgroundColor: theme.colors.panelOuter,
  },
  avatarFrameFocused: {
    ...bevelFocusRaised,
  },
  labelColumn: {
    flex: 1,
    gap: 1,
  },
  name: {
    ...theme.type.displayS,
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
  count: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: TRACK_ROW_FONT_SIZE_COUNT,
    color: theme.colors.textSecondary,
    minWidth: 28,
    textAlign: 'right',
  },
  countFocused: {
    color: theme.colors.highlightBlue,
  },
});
