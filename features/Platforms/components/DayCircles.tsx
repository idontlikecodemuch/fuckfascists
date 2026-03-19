import React, { useRef, useEffect } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { platformsCopy } from '../../../copy/platforms';
import { sharedCopy } from '../../../copy/shared';
import { getWeekDates, isFutureDate } from '../utils/weekDates';
import { theme } from '../../../design/tokens';
import { DAY_CIRCLES_ANIMATE_MS } from '../../../config/constants';

const ROW_HEIGHT = 56;

interface DayCirclesProps {
  weekOf: string;
  platformName: string;
  dayCounts: Map<string, number>;
  onAvoidDate: (date: string) => Promise<void>;
  expanded: boolean;
}

/**
 * Animated day circles row (M T W T F S S).
 * Height animates between 0 and ROW_HEIGHT. Circles stay mounted inside —
 * no remount on expand/collapse, just container clip.
 *
 * - Checked: green with checkmark (disabled)
 * - Unchecked past/today: empty, tappable
 * - Future: faded, not tappable
 */
export function DayCircles({ weekOf, platformName, dayCounts, onAvoidDate, expanded }: DayCirclesProps) {
  const heightAnim = useRef(new Animated.Value(expanded ? ROW_HEIGHT : 0)).current;

  useEffect(() => {
    Animated.timing(heightAnim, {
      toValue: expanded ? ROW_HEIGHT : 0,
      duration: DAY_CIRCLES_ANIMATE_MS,
      useNativeDriver: false,
    }).start();
  }, [expanded, heightAnim]);

  const dates = getWeekDates(weekOf);

  return (
    <Animated.View style={[styles.wrapper, { height: heightAnim }]}>
      <View style={styles.container} accessibilityRole="list">
        {dates.map((date, index) => {
          const dayLabel = platformsCopy.dayLabels[index]!;
          const count = dayCounts.get(date) ?? 0;
          const checked = count > 0;
          const future = isFutureDate(date);

          const a11yLabel = future
            ? platformsCopy.dayFutureLabel(dayLabel)
            : checked
              ? platformsCopy.dayCheckedLabel(dayLabel, platformName)
              : platformsCopy.dayUncheckedLabel(dayLabel, platformName);

          return (
            <View key={date} style={styles.dayColumn}>
              <Text style={styles.dayLabel} allowFontScaling>{dayLabel}</Text>
              <Pressable
                onPress={(!checked && !future) ? async () => { await onAvoidDate(date); } : undefined}
                disabled={checked || future}
                style={[
                  styles.circle,
                  checked && styles.circleChecked,
                  future && styles.circleFuture,
                ]}
                accessibilityRole="button"
                accessibilityLabel={a11yLabel}
                accessibilityState={{ disabled: checked || future }}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                {checked && (
                  <Text style={styles.checkmark} allowFontScaling={false}>
                    {sharedCopy.checkmark}
                  </Text>
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    backgroundColor: theme.colors.surface1,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface2,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.md,
    height: ROW_HEIGHT,
  },
  dayColumn: {
    alignItems: 'center',
    gap: theme.space.xs,
  },
  dayLabel: {
    ...theme.type.caption,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.frameBlue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface1,
  },
  circleChecked: {
    backgroundColor: theme.colors.successGreen,
    borderColor: theme.colors.successGreen,
  },
  circleFuture: {
    borderColor: theme.colors.textSecondary,
    backgroundColor: 'transparent',
    opacity: 0.3,
  },
  checkmark: {
    fontFamily: theme.fonts.headline,
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
});
