import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { platformsCopy } from '../../../copy/platforms';
import { sharedCopy } from '../../../copy/shared';
import { theme } from '../../../design/tokens';
import { useTrack, getDisplayFigure } from '../context/TrackContext';
import { getLocalDateString } from '../../../core/utils/localDate';
import type { TrackListItem } from './TrackList';

interface TrackRowProps {
  item: TrackListItem;
  expanded: boolean;
  onToggleExpand: (platformId: string) => void;
}

/**
 * Renders a single row in the Track FlatList.
 * Three variants: groupHeader, childRow, platformRow.
 */
export function TrackRow({ item, expanded, onToggleExpand }: TrackRowProps) {
  const { focusedPlatformId, setFocusedPlatformId, avoid, weekAvoids, todayActions, isDefeated } = useTrack();

  if (item.type === 'groupHeader') {
    return (
      <GroupHeaderRow
        item={item}
        focused={focusedPlatformId !== null && item.childPlatformIds.some((id) => id === focusedPlatformId)}
      />
    );
  }

  const platformItem = weekAvoids.find((wa) => wa.platform.id === item.platformId);
  if (!platformItem) return null;

  const platform = platformItem.platform;
  const figure = getDisplayFigure(platform);
  const spriteId = nameToSpriteId(figure);
  const weeklyCount = platformItem.weeklyCount;
  const todayCount = platformItem.dayCounts.get(getLocalDateString()) ?? 0;
  const avoidedToday = todayCount > 0;
  const focused = focusedPlatformId === item.platformId;
  const dimmed = focusedPlatformId !== null && !focused;
  const isChild = item.type === 'childRow';

  const handleRowPress = useCallback(() => {
    if (focused) {
      // Already focused: toggle expand
      onToggleExpand(item.platformId);
    } else {
      // Focus this row
      setFocusedPlatformId(item.platformId);
    }
  }, [focused, item.platformId, setFocusedPlatformId, onToggleExpand]);

  const handleAvoidPress = useCallback(async () => {
    if (!avoidedToday) {
      await avoid(item.platformId);
      // Auto-focus on avoid
      if (!focused) setFocusedPlatformId(item.platformId);
    } else {
      // Already avoided today: second tap expands day circles
      onToggleExpand(item.platformId);
    }
  }, [avoidedToday, avoid, item.platformId, focused, setFocusedPlatformId, onToggleExpand]);

  return (
    <View style={[styles.rowOuter, dimmed && styles.rowDimmed]}>
      <Pressable
        onPress={handleRowPress}
        style={[
          styles.row,
          isChild && styles.rowChild,
          focused && styles.rowFocused,
          expanded && styles.rowExpanded,
        ]}
        accessibilityRole="button"
        accessibilityLabel={avoidedToday
          ? platformsCopy.avoidedLabel(platform.name)
          : platformsCopy.notAvoidedLabel(platform.name)}
      >
        {/* Sprite (only for platformRow singletons, not children) */}
        {!isChild && (
          <SpriteView
            spriteId={spriteId}
            state={isDefeated(figure) ? 'defeated' : 'neutral'}
            size={36}
            headOnly
            opacity={weeklyCount > 0 ? 1 : 0.4}
          />
        )}

        {/* Name + subtitle */}
        <View style={[styles.info, isChild && styles.infoChild]}>
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
        {weeklyCount > 0 && (
          <Text
            style={styles.count}
            allowFontScaling
            accessibilityLabel={platformsCopy.countA11y(weeklyCount, platform.name)}
          >
            {platformsCopy.countLabel(weeklyCount)}
          </Text>
        )}

        {/* Avoid button */}
        <Pressable
          onPress={handleAvoidPress}
          style={[styles.avoidBtn, avoidedToday && styles.avoidBtnDone]}
          accessibilityRole="button"
          accessibilityLabel={avoidedToday
            ? platformsCopy.avoidedLabel(platform.name)
            : platformsCopy.notAvoidedLabel(platform.name)}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Text
            style={[styles.avoidText, avoidedToday && styles.avoidTextDone]}
            allowFontScaling={false}
          >
            {avoidedToday ? sharedCopy.checkmark : platformsCopy.avoidBtn}
          </Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

// ── Group header sub-component ───────────────────────────────────────────────

function GroupHeaderRow({
  item,
  focused,
}: {
  item: Extract<TrackListItem, { type: 'groupHeader' }>;
  focused: boolean;
}) {
  const { setFocusedPlatformId, weekAvoids, isDefeated, personWeeklyAvoids } = useTrack();
  const spriteId = nameToSpriteId(item.figureName);
  const totalAvoids = personWeeklyAvoids(item.figureName);
  const defeated = isDefeated(item.figureName);
  const dimmed = useTrack().focusedPlatformId !== null && !focused;

  const handlePress = useCallback(() => {
    // Set focus to the first child platform
    if (item.childPlatformIds.length > 0) {
      setFocusedPlatformId(item.childPlatformIds[0]!);
    }
  }, [item.childPlatformIds, setFocusedPlatformId]);

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.groupHeader, dimmed && styles.rowDimmed]}
      accessibilityRole="header"
      accessibilityLabel={platformsCopy.groupHeader(item.shortName, totalAvoids)}
    >
      <SpriteView
        spriteId={spriteId}
        state={defeated ? 'defeated' : 'neutral'}
        size={36}
        headOnly
        opacity={totalAvoids > 0 ? 1 : 0.4}
      />
      <Text style={styles.groupName} numberOfLines={1} allowFontScaling>
        {item.shortName}
      </Text>
      {totalAvoids > 0 && (
        <Text style={styles.groupCount} allowFontScaling>
          {platformsCopy.countLabel(totalAvoids)}
        </Text>
      )}
    </Pressable>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  rowOuter: {
    opacity: 1,
  },
  rowDimmed: {
    opacity: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    minHeight: theme.a11y.minTapTarget,
    gap: theme.space.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface2,
  },
  rowChild: {
    paddingLeft: theme.space['3xl'],
  },
  rowFocused: {
    backgroundColor: theme.colors.surface1,
    borderLeftWidth: theme.borders.hero.width,
    borderLeftColor: theme.colors.rewardYellow,
  },
  rowExpanded: {
    borderBottomWidth: 0,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  infoChild: {
    paddingLeft: 0,
  },
  name: {
    ...theme.type.uiLabel,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.type.caption,
    color: theme.colors.textSecondary,
  },
  count: {
    ...theme.type.uiLabel,
    color: theme.colors.rewardYellow,
    minWidth: 32,
    textAlign: 'right',
  },
  avoidBtn: {
    minWidth: 64,
    minHeight: theme.a11y.minTapTarget,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.frameBlue,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.space.sm,
  },
  avoidBtnDone: {
    borderColor: theme.colors.successGreen,
    backgroundColor: theme.colors.successGreen,
  },
  avoidText: {
    ...theme.type.caption,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  avoidTextDone: {
    color: theme.colors.bgVoid,
    fontSize: 16,
    fontFamily: theme.fonts.headline,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
    gap: theme.space.sm,
    borderBottomWidth: theme.borders.standard.width,
    borderBottomColor: theme.colors.frameBlue,
    backgroundColor: theme.colors.surface2,
    minHeight: theme.a11y.minTapTarget,
  },
  groupName: {
    ...theme.type.displayS,
    color: theme.colors.textPrimary,
    flex: 1,
    letterSpacing: 1,
  },
  groupCount: {
    ...theme.type.uiLabel,
    color: theme.colors.rewardYellow,
  },
});
