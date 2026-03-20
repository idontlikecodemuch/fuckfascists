import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { useTrack, getDisplayFigure } from '../context/TrackContext';
import { getLocalDateString } from '../../../core/utils/localDate';
import { AvoidButton } from './AvoidButton';
import { DayCircles } from './DayCircles';
import {
  TRACK_ROW_PADDING_VERTICAL,
  TRACK_ROW_PADDING_HORIZONTAL,
  TRACK_CHILD_INDENT,
  TRACK_ROW_SPRITE_SIZE,
  TRACK_ROW_FONT_SIZE_NAME,
  TRACK_ROW_FONT_SIZE_SUBTITLE,
  TRACK_ROW_FONT_SIZE_COUNT,
  TRACK_ROW_FOCUS_BORDER_COLOR,
  TRACK_ROW_FOCUS_BG_COLOR,
  TRACK_ROW_DIMMED_OPACITY,
  TRACK_EXPAND_INDICATOR_SIZE,
} from '../../../config/constants';

interface PlatformRowProps {
  platformId: string;
  /** True when this is a child row under a group header. */
  isChild: boolean;
}

/**
 * Renders a single platform row (both childRow and platformRow types).
 * Differences between child/singleton driven by isChild prop:
 *   - Child: indented, no sprite bust, no figure name subtitle
 *   - Singleton: no indent, shows sprite bust + figure name subtitle
 *
 * Two tap zones side by side:
 *   1. RowBody (Pressable, flex:1): focus/expand/collapse logic
 *   2. AvoidButton: avoid or expand logic
 *
 * Reads expandedIds + toggleExpand directly from TrackContext to bypass
 * FlatList cell memoization — context changes re-render the component
 * immediately without depending on FlatList's renderItem cycle.
 */
export function PlatformRow({ platformId, isChild }: PlatformRowProps) {
  const {
    focusedPlatformId, setFocusedPlatformId,
    expandedIds, toggleExpand,
    avoid, avoidForDate, weekAvoids, weekOf, isDefeated,
  } = useTrack();

  const platformItem = weekAvoids.find((wa) => wa.platform.id === platformId);
  if (!platformItem) return null;

  const platform = platformItem.platform;
  const figure = getDisplayFigure(platform);
  const spriteId = nameToSpriteId(figure);
  const weeklyCount = platformItem.weeklyCount;
  const todayCount = platformItem.dayCounts.get(getLocalDateString()) ?? 0;
  const avoidedToday = todayCount > 0;
  const focused = focusedPlatformId === platformId;
  const expanded = expandedIds.has(platformId);
  const dimmed = focusedPlatformId !== null && !focused;

  // Row body tap: focus → expand → collapse
  const handleRowPress = useCallback(() => {
    if (focused) {
      toggleExpand(platformId);
    } else {
      setFocusedPlatformId(platformId);
    }
  }, [focused, platformId, setFocusedPlatformId, toggleExpand]);

  // Avoid button tap
  const handleAvoidPress = useCallback(async () => {
    if (!avoidedToday) {
      await avoid(platformId);
      if (!focused) setFocusedPlatformId(platformId);
    } else {
      // Already avoided today: toggle expand + focus
      if (!focused) {
        setFocusedPlatformId(platformId);
        if (!expanded) toggleExpand(platformId);
      } else {
        toggleExpand(platformId);
      }
    }
  }, [avoidedToday, avoid, platformId, focused, expanded, setFocusedPlatformId, toggleExpand]);

  return (
    <View style={{ opacity: dimmed ? TRACK_ROW_DIMMED_OPACITY : 1 }}>
      <View
        style={[
          styles.row,
          isChild && styles.childIndent,
          focused && styles.focused,
        ]}
      >
        {/* Row body tap zone */}
        <Pressable
          onPress={handleRowPress}
          style={styles.rowBody}
          accessibilityRole="button"
          accessibilityLabel={
            avoidedToday
              ? platformsCopy.avoidedBtnA11y(platform.name)
              : platformsCopy.avoidBtnA11y(platform.name)
          }
        >
          {/* Expand indicator */}
          <Text style={styles.expandIndicator} allowFontScaling={false}>
            {expanded ? platformsCopy.collapseIndicator : platformsCopy.expandIndicator}
          </Text>

          {/* Sprite bust (singleton only) */}
          {!isChild && (
            <SpriteView
              spriteId={spriteId}
              state={isDefeated(figure) ? 'defeated' : 'neutral'}
              size={TRACK_ROW_SPRITE_SIZE}
              headOnly
              opacity={weeklyCount > 0 ? 1 : 0.4}
            />
          )}

          {/* Name + subtitle */}
          <View style={styles.nameColumn}>
            <Text style={styles.name} numberOfLines={1} allowFontScaling>
              {platform.name}
            </Text>
            {!isChild && (
              <Text style={styles.subtitle} numberOfLines={1} allowFontScaling>
                {figure}
              </Text>
            )}
          </View>

          {/* Weekly count */}
          <Text
            style={[styles.count, weeklyCount > 0 && styles.countActive]}
            allowFontScaling
            accessibilityLabel={platformsCopy.countA11y(weeklyCount, platform.name)}
          >
            {weeklyCount > 0 ? platformsCopy.countLabel(weeklyCount) : platformsCopy.countDash}
          </Text>
        </Pressable>

        {/* Avoid button */}
        <AvoidButton
          avoidedToday={avoidedToday}
          platformName={platform.name}
          onPress={handleAvoidPress}
        />
      </View>

      {/* Day circles (always mounted, height animated) */}
      <DayCircles
        weekOf={weekOf}
        platformName={platform.name}
        dayCounts={platformItem.dayCounts}
        onAvoidDate={async (date) => { await avoidForDate(platformId, date); }}
        expanded={expanded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: TRACK_ROW_PADDING_VERTICAL,
    paddingHorizontal: TRACK_ROW_PADDING_HORIZONTAL,
    minHeight: theme.a11y.minTapTarget,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface2,
    gap: theme.space.sm,
  },
  childIndent: {
    paddingLeft: TRACK_CHILD_INDENT,
  },
  focused: {
    backgroundColor: TRACK_ROW_FOCUS_BG_COLOR,
    borderLeftWidth: 3,
    borderLeftColor: TRACK_ROW_FOCUS_BORDER_COLOR,
  },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
    minHeight: theme.a11y.minTapTarget,
  },
  expandIndicator: {
    fontFamily: theme.fonts.body,
    fontSize: TRACK_EXPAND_INDICATOR_SIZE,
    color: theme.colors.textSecondary,
    width: TRACK_EXPAND_INDICATOR_SIZE,
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
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: TRACK_ROW_FONT_SIZE_COUNT,
    color: theme.colors.textSecondary,
    minWidth: 28,
    textAlign: 'right',
  },
  countActive: {
    color: theme.colors.dangerRed,
  },
});
