import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { FigureBadge } from './FigureBadge';
import {
  TRACK_ROW_FOCUS_BG_COLOR,
  TRACK_ROW_FOCUS_BORDER_COLOR,
  TRACK_ROW_FONT_SIZE_COUNT,
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
    >
      <FigureBadge
        figureName={figureName}
        state="neutral"
        size={TRACK_ROW_SPRITE_SIZE}
        cropRatio={TRACK_SPRITE_BUST_CROP_RATIO}
        cropOffsetX={TRACK_SPRITE_BUST_CROP_OFFSET_X}
        cropOffsetY={TRACK_SPRITE_BUST_CROP_OFFSET_Y}
      />
      <View style={styles.labelColumn}>
        <Text style={styles.name} numberOfLines={1} allowFontScaling>
          {shortName}
        </Text>
      </View>
      <Text style={styles.count} allowFontScaling>
        {totalAvoids > 0 ? platformsCopy.countLabel(totalAvoids) : platformsCopy.countDash}
      </Text>
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
    borderTopWidth: theme.borders.standard.width,
    borderBottomWidth: theme.borders.standard.width,
    borderTopColor: theme.colors.highlightBlue,
    borderBottomColor: TRACK_ROW_FOCUS_BORDER_COLOR,
    backgroundColor: theme.colors.surface2,
  },
  focused: {
    borderLeftWidth: theme.borders.standard.width,
    borderLeftColor: TRACK_ROW_FOCUS_BORDER_COLOR,
    backgroundColor: TRACK_ROW_FOCUS_BG_COLOR,
  },
  labelColumn: {
    flex: 1,
  },
  name: {
    ...theme.type.displayS,
    color: theme.colors.rewardYellow,
    letterSpacing: 1,
  },
  count: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: TRACK_ROW_FONT_SIZE_COUNT,
    color: theme.colors.rewardYellow,
    minWidth: 28,
    textAlign: 'right',
  },
});
