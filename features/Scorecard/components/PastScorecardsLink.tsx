import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { formatReadableDate } from '../utils/formatters';

interface PastScorecardsLinkProps {
  onPress: () => void;
  /** Week of a card saved after its drop window; shows a one-line notice. */
  lateWeek?: string | null;
  style?: StyleProp<ViewStyle>;
}

/** "Past scorecards" link, with the late-card notice above it when set. */
export function PastScorecardsLink({ onPress, lateWeek, style }: PastScorecardsLinkProps) {
  return (
    <View style={[styles.container, style]}>
      {lateWeek && (
        <Text style={styles.notice}>
          {scorecardCopy.lateCardNotice(formatReadableDate(lateWeek))}
        </Text>
      )}
      <Pressable style={styles.link} onPress={onPress} accessibilityRole="link">
        <Text style={styles.linkText}>{scorecardCopy.pastCardsLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  notice: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: theme.space.lg,
    paddingTop: theme.space.md,
  },
  link: {
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.lg,
  },
  linkText: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 12,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    textDecorationLine: 'underline',
  },
});
