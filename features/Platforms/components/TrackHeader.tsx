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
 * Track screen header: title, week label, total avoids, EDIT button.
 * Auto-height — no fixed sizing.
 */
export function TrackHeader({ onEdit }: TrackHeaderProps) {
  const { weekOf, totalAvoids } = useTrack();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.title} accessibilityRole="header" allowFontScaling>
          {platformsCopy.title}
        </Text>
        <Pressable
          onPress={onEdit}
          style={styles.editBtn}
          accessibilityRole="button"
          accessibilityLabel={platformsCopy.editLabel}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editText} allowFontScaling>{platformsCopy.editBtn}</Text>
        </Pressable>
      </View>
      <View style={styles.bottomRow}>
        <Text style={styles.weekLabel} allowFontScaling>
          {platformsCopy.weekLabel(formatWeekOf(weekOf))}
        </Text>
        <Text style={styles.score} allowFontScaling>
          {platformsCopy.score(totalAvoids)}
        </Text>
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
  title: {
    ...theme.type.displayL,
    color: theme.colors.textPrimary,
    letterSpacing: 3,
  },
  editBtn: {
    minWidth: theme.a11y.minTapTarget,
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editText: {
    ...theme.type.uiLabel,
    color: theme.colors.rewardYellow,
    letterSpacing: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.space.xs,
  },
  weekLabel: {
    ...theme.type.caption,
    color: theme.colors.textSecondary,
  },
  score: {
    ...theme.type.caption,
    color: theme.colors.rewardYellow,
  },
});
