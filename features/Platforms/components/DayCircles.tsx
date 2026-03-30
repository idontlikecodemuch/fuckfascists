import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { platformsCopy } from '../../../copy/platforms';
import { sharedCopy } from '../../../copy/shared';
import { getWeekDates, isFutureDate } from '../utils/weekDates';
import { theme } from '../../../design/tokens';
import { bevelInset, bevelGreenInset } from '../../../design/bevel';
import {
  TRACK_CHILD_INDENT,
  TRACK_DAY_CIRCLE_SIZE,
  TRACK_DAY_CIRCLES_GAP,
  TRACK_ROW_FOCUS_BG_COLOR,
  TRACK_ROW_PADDING_HORIZONTAL,
} from '../../../config/constants';

interface DayCirclesProps {
  weekOf: string;
  platformName: string;
  dayCounts: Map<string, number>;
  onAvoidDate: (date: string) => Promise<void>;
  isChild: boolean;
}

/**
 * - Checked: green fill + checkmark, not tappable
 * - Open (past/today): empty bordered, tappable
 * - Future: faded, not tappable
 */
export function DayCircles({ weekOf, platformName, dayCounts, onAvoidDate, isChild }: DayCirclesProps) {
  const dates = getWeekDates(weekOf);

  return (
    <View style={[styles.wrapper, isChild && styles.childWrapper]}>
      <View style={styles.container} accessibilityRole="list">
        {dates.map((date, index) => {
          const dayLabel = platformsCopy.dayLabels[index]!;
          const count = dayCounts.get(date) ?? 0;
          const checked = count > 0;
          const future = isFutureDate(date);
          const isToday = date === new Date().toISOString().slice(0, 10);

          const a11yLabel = future
            ? platformsCopy.dayFutureLabel(dayLabel)
            : checked
              ? platformsCopy.dayCheckedLabel(dayLabel, platformName)
              : platformsCopy.dayUncheckedLabel(dayLabel, platformName);

          return (
            <View key={date} style={styles.dayColumn}>
              <Text
                style={[styles.dayLabel, isToday && styles.dayLabelToday]}
                allowFontScaling
              >
                {dayLabel}
              </Text>
              <Pressable
                onPress={(!checked && !future) ? async () => { await onAvoidDate(date); } : undefined}
                disabled={checked || future}
                style={[
                  styles.tile,
                  checked && styles.tileChecked,
                  !checked && !future && styles.tileOpen,
                  !checked && !future && isToday && styles.tileToday,
                  future && styles.tileFuture,
                ]}
                accessibilityRole="button"
                accessibilityLabel={a11yLabel}
                accessibilityState={{ disabled: checked || future }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: TRACK_ROW_FOCUS_BG_COLOR,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.bevelDark,
  },
  childWrapper: {
    paddingLeft: TRACK_CHILD_INDENT,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: theme.space.xs,
    paddingHorizontal: TRACK_ROW_PADDING_HORIZONTAL,
    alignItems: 'center',
    gap: TRACK_DAY_CIRCLES_GAP,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 2,
  },
  dayLabel: {
    ...theme.type.caption,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  dayLabelToday: {
    color: theme.colors.focusAccent,
  },
  tile: {
    width: TRACK_DAY_CIRCLE_SIZE,
    height: TRACK_DAY_CIRCLE_SIZE,
    borderRadius: theme.radii.token,
    ...bevelInset,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.panelOuter,
  },
  tileChecked: {
    backgroundColor: theme.colors.successGreenDeep,
    ...bevelGreenInset,
  },
  tileOpen: {
    borderBottomColor: theme.colors.bevelLight,
    borderRightColor: theme.colors.bevelLight,
  },
  tileToday: {
    borderBottomColor: theme.colors.focusAccent,
    borderRightColor: theme.colors.focusAccent,
  },
  tileFuture: {
    opacity: 0.2,
  },
  checkmark: {
    fontFamily: theme.fonts.headline,
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.successGreenText,
  },
});
