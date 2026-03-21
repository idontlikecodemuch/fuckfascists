import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { useTrack } from '../context/TrackContext';
import { formatWeekOf } from '../utils/platformHelpers';

interface TrackHeaderProps {
  onEdit: () => void;
}

export function TrackHeader({ onEdit }: TrackHeaderProps) {
  const { totalAvoids, weekOf } = useTrack();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.weekLabel} allowFontScaling>
          {platformsCopy.weekLabel(formatWeekOf(weekOf))}
        </Text>
        <Pressable
          onPress={onEdit}
          style={styles.editLink}
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
        <Text style={styles.countText} allowFontScaling>
          {totalAvoids > 0
            ? platformsCopy.avoidCountLabel(totalAvoids)
            : platformsCopy.pumpUp}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.bgVoid,
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.md,
    paddingBottom: theme.space.sm,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.space.md,
  },
  weekLabel: {
    ...theme.type.caption,
    color: theme.colors.textSecondary,
  },
  editLink: {
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
  },
  countText: {
    ...theme.type.displayM,
    color: theme.colors.rewardYellow,
  },
});
