import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { getLocalDateString } from '../../../core/utils/localDate';
import type { PlatformItem } from '../types';
import { getDisplayFigure } from '../context/TrackContext';
import { AvoidButton } from './AvoidButton';
import { FigureBadge } from './FigureBadge';
import {
  TRACK_CHILD_INDENT,
  TRACK_CHILD_FONT_SIZE_COUNT,
  TRACK_CHILD_FONT_SIZE_NAME,
  TRACK_CHILD_GUIDE_COLOR,
  TRACK_CHILD_ROW_BG_COLOR,
  TRACK_EXPAND_INDICATOR_SIZE,
  TRACK_ROW_DIMMED_OPACITY,
  TRACK_ROW_FOCUS_BG_COLOR,
  TRACK_ROW_FOCUS_BORDER_COLOR,
  TRACK_ROW_FONT_SIZE_COUNT,
  TRACK_ROW_FONT_SIZE_NAME,
  TRACK_ROW_FONT_SIZE_SUBTITLE,
  TRACK_ROW_PADDING_HORIZONTAL,
  TRACK_ROW_PADDING_VERTICAL,
  TRACK_ROW_SPRITE_SIZE,
  TRACK_SPRITE_BUST_CROP_OFFSET_X,
  TRACK_SPRITE_BUST_CROP_OFFSET_Y,
  TRACK_SPRITE_BUST_CROP_RATIO,
} from '../../../config/constants';

interface PlatformRowProps {
  item: PlatformItem;
  isChild: boolean;
  focused: boolean;
  expanded: boolean;
  dimmed: boolean;
  onRowPress: () => void;
  onAvoidPress: () => void;
}

export function PlatformRow({
  item,
  isChild,
  focused,
  expanded,
  dimmed,
  onRowPress,
  onAvoidPress,
}: PlatformRowProps) {
  const figureName = getDisplayFigure(item.platform);
  const todayAvoided = (item.dayCounts.get(getLocalDateString()) ?? 0) > 0;
  const countLabel = item.weeklyCount > 0
    ? platformsCopy.countLabel(item.weeklyCount)
    : platformsCopy.countDash;

  return (
    <View style={[styles.row, isChild && styles.childRow, focused && styles.focusedRow]}>
      <Pressable
        onPress={onRowPress}
        style={[styles.rowBody, dimmed && styles.dimmedBody]}
        accessibilityRole="button"
        accessibilityLabel={
          expanded
            ? platformsCopy.collapseLabel(item.platform.name)
            : platformsCopy.expandLabel(item.platform.name)
        }
      >
          <Text style={styles.expandIndicator} allowFontScaling={false}>
            {expanded ? platformsCopy.collapseIndicator : platformsCopy.expandIndicator}
          </Text>

          {isChild && <View style={styles.childGuide} />}

          {!isChild && (
            <FigureBadge
              figureName={figureName}
              state="neutral"
              size={TRACK_ROW_SPRITE_SIZE}
              cropRatio={TRACK_SPRITE_BUST_CROP_RATIO}
              cropOffsetX={TRACK_SPRITE_BUST_CROP_OFFSET_X}
              cropOffsetY={TRACK_SPRITE_BUST_CROP_OFFSET_Y}
            />
        )}

        <View style={styles.nameColumn}>
          <Text
            style={[styles.name, isChild && styles.childName, isChild && focused && styles.childNameFocused]}
            numberOfLines={1}
            allowFontScaling
          >
            {item.platform.name}
          </Text>
          {!isChild && (
            <Text style={styles.subtitle} numberOfLines={1} allowFontScaling>
              {figureName}
            </Text>
          )}
        </View>

        <Text
          style={[styles.count, isChild && styles.childCount, item.weeklyCount > 0 && styles.countActive]}
          allowFontScaling
          accessibilityLabel={platformsCopy.countA11y(item.weeklyCount, item.platform.name)}
        >
          {countLabel}
        </Text>
      </Pressable>

      <AvoidButton
        avoidedToday={todayAvoided}
        platformName={item.platform.name}
        onPress={onAvoidPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: theme.a11y.minTapTarget,
    paddingHorizontal: TRACK_ROW_PADDING_HORIZONTAL,
    paddingVertical: TRACK_ROW_PADDING_VERTICAL,
    borderBottomWidth: theme.borders.standard.width,
    borderBottomColor: theme.colors.surface2,
    backgroundColor: theme.colors.surface1,
  },
  childRow: {
    paddingLeft: TRACK_CHILD_INDENT,
    backgroundColor: TRACK_CHILD_ROW_BG_COLOR,
  },
  focusedRow: {
    borderLeftWidth: 3,
    borderLeftColor: TRACK_ROW_FOCUS_BORDER_COLOR,
    backgroundColor: TRACK_ROW_FOCUS_BG_COLOR,
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: theme.a11y.minTapTarget,
  },
  dimmedBody: {
    opacity: TRACK_ROW_DIMMED_OPACITY,
  },
  expandIndicator: {
    width: TRACK_EXPAND_INDICATOR_SIZE,
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.body,
    fontSize: TRACK_EXPAND_INDICATOR_SIZE,
    textAlign: 'center',
  },
  childGuide: {
    width: 12,
    height: 12,
    marginRight: theme.space.xs,
    borderLeftWidth: theme.borders.standard.width,
    borderBottomWidth: theme.borders.standard.width,
    borderColor: TRACK_CHILD_GUIDE_COLOR,
    opacity: 0.85,
  },
  nameColumn: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: TRACK_ROW_FONT_SIZE_NAME,
    color: theme.colors.textPrimary,
  },
  childName: {
    fontSize: TRACK_CHILD_FONT_SIZE_NAME,
    fontFamily: theme.fonts.bodyMedium,
    color: theme.colors.textSecondary,
  },
  childNameFocused: {
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontFamily: theme.fonts.body,
    fontSize: TRACK_ROW_FONT_SIZE_SUBTITLE,
    color: theme.colors.textSecondary,
  },
  count: {
    minWidth: 28,
    textAlign: 'right',
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: TRACK_ROW_FONT_SIZE_COUNT,
    color: theme.colors.textSecondary,
  },
  childCount: {
    fontSize: TRACK_CHILD_FONT_SIZE_COUNT,
  },
  countActive: {
    color: theme.colors.dangerRed,
  },
});
