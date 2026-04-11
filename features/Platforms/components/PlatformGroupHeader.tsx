import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { bevelRaised, bevelFocusRaised } from '../../../design/bevel';
import { SparkleDecoration } from '../../../core/fx';
import { hasSprite } from '../../../core/sprites/spriteLoader';
import { FigureBadge } from './FigureBadge';
import {
  TRACK_ROW_FONT_SIZE_COUNT,
  TRACK_ROW_FONT_SIZE_SUBTITLE,
  TRACK_ROW_PADDING_HORIZONTAL,
  TRACK_ROW_PADDING_VERTICAL,
  TRACK_ROW_SPRITE_SIZE,
  TRACK_SPRITE_BUST_CROP_OFFSET_X,
  TRACK_SPRITE_BUST_CROP_OFFSET_Y,
  TRACK_SPRITE_BUST_CROP_RATIO,
} from '../../../config/constants';

interface PlatformGroupHeaderProps {
  figureName: string;
  shortName: string;
  totalAvoids: number;
  focused: boolean;
  onPress: () => void;
}

export function PlatformGroupHeader({
  figureName,
  shortName,
  totalAvoids,
  focused,
  onPress,
}: PlatformGroupHeaderProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.container, focused && styles.focused]}
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
            cropOffsetX={TRACK_SPRITE_BUST_CROP_OFFSET_X}
            cropOffsetY={TRACK_SPRITE_BUST_CROP_OFFSET_Y}
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
    paddingVertical: TRACK_ROW_PADDING_VERTICAL,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.panelBorder,
    backgroundColor: theme.colors.panelInner,
    overflow: 'visible',
  },
  focused: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.focusAccent,
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
