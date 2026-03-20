import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { useTrack } from '../context/TrackContext';
import { formatWeekOf } from '../utils/platformHelpers';

interface TrackHeaderProps {
  onEdit: () => void;
}

/**
 * Track screen header. No screen title (tab already says TRACK).
 *
 * Layout:
 *   Top row: "Week of Mar 16" left, "Edit platforms" right (underlined)
 *   Main area: weekly avoid count (big, amber) or pump-up text when zero
 */
export function TrackHeader({ onEdit }: TrackHeaderProps) {
  const { weekOf, totalAvoids } = useTrack();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.weekLabel} allowFontScaling>
          {platformsCopy.weekLabel(formatWeekOf(weekOf))}
        </Text>
        <Pressable
          onPress={onEdit}
          style={styles.editBtn}
          accessibilityRole="link"
          accessibilityLabel={platformsCopy.editPlatformsA11y}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editText} allowFontScaling>
            {platformsCopy.editPlatforms}
          </Text>
        </Pressable>
      </View>
      <View style={styles.countArea}>
        {totalAvoids > 0 ? (
          <Text style={styles.countText} allowFontScaling>
            {platformsCopy.avoidCountLabel(totalAvoids)}
          </Text>
        ) : (
          <Text style={styles.pumpText} allowFontScaling>
            {platformsCopy.pumpUp}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.md,
    paddingBottom: theme.space.sm,
    borderBottomWidth: theme.borders.standard.width,
    borderBottomColor: theme.colors.frameBlue,
    backgroundColor: theme.colors.bgVoid,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekLabel: {
    ...theme.type.caption,
    color: theme.colors.textSecondary,
  },
  editBtn: {
    minHeight: theme.a11y.minTapTarget,
    justifyContent: 'center',
  },
  editText: {
    ...theme.type.bodyS,
    color: theme.colors.rewardYellow,
    textDecorationLine: 'underline',
  },
  countArea: {
    marginTop: theme.space.xs,
    paddingBottom: theme.space.xs,
  },
  countText: {
    ...theme.type.displayM,
    color: theme.colors.rewardYellow,
  },
  pumpText: {
    ...theme.type.displayM,
    color: theme.colors.rewardYellow,
  },
});
