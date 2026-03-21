import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { getLocalDateString } from '../../../core/utils/localDate';
import type { PlatformItem } from '../types';
import { getDisplayFigure } from '../context/TrackContext';
import { AvoidButton } from './AvoidButton';
import { DayCircles } from './DayCircles';
import {
  TRACK_CHILD_INDENT,
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
} from '../../../config/constants';

interface PlatformRowProps {
  item: PlatformItem;
  isChild: boolean;
  weekOf: string;
  focused: boolean;
  expanded: boolean;
  dimmed: boolean;
  defeated: boolean;
  onRowPress: () => void;
  onAvoidPress: () => void;
  onAvoidDate: (date: string) => Promise<void>;
}

export function PlatformRow({
  item,
  isChild,
  weekOf,
  focused,
  expanded,
  dimmed,
  defeated,
  onRowPress,
  onAvoidPress,
  onAvoidDate,
}: PlatformRowProps) {
  const figureName = getDisplayFigure(item.platform);
  const todayAvoided = (item.dayCounts.get(getLocalDateString()) ?? 0) > 0;
  const countLabel = item.weeklyCount > 0
    ? platformsCopy.countLabel(item.weeklyCount)
    : platformsCopy.countDash;

  return (
    <View>
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

          {!isChild && (
            <SpriteView
              spriteId={nameToSpriteId(figureName)}
              state={defeated ? 'defeated' : 'neutral'}
              size={TRACK_ROW_SPRITE_SIZE}
              headOnly
            />
          )}

          <View style={styles.nameColumn}>
            <Text style={styles.name} numberOfLines={1} allowFontScaling>
              {item.platform.name}
            </Text>
            {!isChild && (
              <Text style={styles.subtitle} numberOfLines={1} allowFontScaling>
                {figureName}
              </Text>
            )}
          </View>

          <Text
            style={[styles.count, item.weeklyCount > 0 && styles.countActive]}
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

      <DayCircles
        weekOf={weekOf}
        platformName={item.platform.name}
        dayCounts={item.dayCounts}
        onAvoidDate={onAvoidDate}
        expanded={expanded}
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
  nameColumn: {
    flex: 1,
    gap: 1,
  },
  name: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: TRACK_ROW_FONT_SIZE_NAME,
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
  countActive: {
    color: theme.colors.dangerRed,
  },
});
