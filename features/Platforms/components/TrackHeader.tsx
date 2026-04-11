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

  const hasAvoids = totalAvoids > 0;

  return (
    <View style={styles.bar}>
      <Text
        style={[styles.count, hasAvoids ? styles.countActive : styles.countEmpty]}
        allowFontScaling
      >
        {hasAvoids
          ? platformsCopy.avoidCountLabel(totalAvoids)
          : platformsCopy.pumpUp}
      </Text>

      <View style={styles.right}>
        <Text style={styles.weekLabel} allowFontScaling>
          {platformsCopy.weekLabel(formatWeekOf(weekOf))}
          {'  \u00b7  '}
        </Text>
        <Pressable
          onPress={onEdit}
          accessibilityRole="link"
          accessibilityLabel={platformsCopy.editPlatformsA11y}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.editText} allowFontScaling>
            {platformsCopy.editPlatforms}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.panelInner,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.xs,
    zIndex: 2,
  },
  count: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  countActive: {
    color: theme.colors.dangerRed,
    textShadowColor: 'rgba(255, 59, 48, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  countEmpty: {
    color: theme.colors.amberAction,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekLabel: {
    ...theme.type.caption,
    color: theme.colors.textSecondary,
  },
  editText: {
    ...theme.type.caption,
    color: theme.colors.focusAccent,
  },
});
