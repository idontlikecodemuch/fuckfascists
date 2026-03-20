import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { useTrack } from '../context/TrackContext';
import {
  TRACK_ROW_PADDING_VERTICAL,
  TRACK_ROW_PADDING_HORIZONTAL,
  TRACK_ROW_SPRITE_SIZE,
  TRACK_ROW_DIMMED_OPACITY,
  TRACK_ROW_FONT_SIZE_COUNT,
} from '../../../config/constants';

interface PlatformGroupHeaderProps {
  figureName: string;
  shortName: string;
  childPlatformIds: string[];
}

/**
 * Group header row for a parent company (e.g. META, X CORP).
 * Shows sprite bust, short name, and roll-up avoid count.
 * Tapping sets focus to this group's publicFigureName.
 */
export function PlatformGroupHeader({ figureName, shortName, childPlatformIds }: PlatformGroupHeaderProps) {
  const { focusedPlatformId, setFocusedPlatformId, personWeeklyAvoids } = useTrack();
  const spriteId = nameToSpriteId(figureName);
  const totalAvoids = personWeeklyAvoids(figureName);

  const isFocused = focusedPlatformId !== null &&
    childPlatformIds.includes(focusedPlatformId);
  const isDimmed = focusedPlatformId !== null && !isFocused;

  const handlePress = useCallback(() => {
    if (childPlatformIds.length > 0) {
      setFocusedPlatformId(childPlatformIds[0]!);
    }
  }, [childPlatformIds, setFocusedPlatformId]);

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.container, isDimmed && styles.dimmed]}
      accessibilityRole="header"
      accessibilityLabel={platformsCopy.groupHeaderA11y(shortName, totalAvoids)}
    >
      <SpriteView
        spriteId={spriteId}
        state="neutral"
        size={TRACK_ROW_SPRITE_SIZE}
        headOnly
        opacity={totalAvoids > 0 ? 1 : 0.4}
      />
      <Text style={styles.name} numberOfLines={1} allowFontScaling>
        {shortName}
      </Text>
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
    paddingHorizontal: TRACK_ROW_PADDING_HORIZONTAL,
    paddingVertical: TRACK_ROW_PADDING_VERTICAL,
    gap: theme.space.sm,
    borderBottomWidth: theme.borders.standard.width,
    borderBottomColor: theme.colors.frameBlue,
    backgroundColor: theme.colors.surface2,
    minHeight: theme.a11y.minTapTarget,
  },
  dimmed: {
    opacity: TRACK_ROW_DIMMED_OPACITY,
  },
  name: {
    ...theme.type.displayS,
    color: theme.colors.textPrimary,
    flex: 1,
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
