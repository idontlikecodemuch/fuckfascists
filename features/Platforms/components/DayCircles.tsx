import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { platformsCopy } from '../../../copy/platforms';
import { sharedCopy } from '../../../copy/shared';
import { getWeekDates, isFutureDate } from '../utils/weekDates';
import { theme } from '../../../design/tokens';

interface DayCirclesProps {
  weekOf: string;
  platformName: string;
  dayCounts: Map<string, number>;
  onAvoidDate: (date: string) => Promise<void>;
}

/**
 * Renders 7 day circles (M T W T F S S) for the current week.
 * - Checked days: filled green with checkmark
 * - Unchecked past/current days: empty, tappable
 * - Future days: faint/disabled
 *
 * Tapping an unchecked non-future day logs an avoid for that date.
 * Tapping a checked day does nothing (no undo in MVP).
 */
export function DayCircles({ weekOf, platformName, dayCounts, onAvoidDate }: DayCirclesProps) {
  const dates = getWeekDates(weekOf);

  return (
    <View style={styles.container} accessibilityRole="list">
      {dates.map((date, index) => {
        const dayLabel = platformsCopy.dayLabels[index];
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
  );
}

const styles = StyleSheet.create({
  container:     { flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: theme.space.sm, paddingHorizontal: theme.space.md },
  dayColumn:     { alignItems: 'center', gap: theme.space.xs },
  dayLabel:      { ...theme.type.caption, fontWeight: 'bold', color: theme.colors.textPrimary },
  circle:        { width: 36, height: 36, borderRadius: 18, borderWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface1 },
  circleChecked: { backgroundColor: theme.colors.successGreen, borderColor: theme.colors.successGreen },
  circleFuture:  { borderColor: theme.colors.surface2, backgroundColor: theme.colors.surface2, opacity: 0.3 },
  checkmark:     { fontFamily: theme.fonts.headline, fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
});
