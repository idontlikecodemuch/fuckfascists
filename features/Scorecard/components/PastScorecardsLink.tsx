import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';

interface PastScorecardsLinkProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/** "Past scorecards" link under the live preview and the empty-week state. */
export function PastScorecardsLink({ onPress, style }: PastScorecardsLinkProps) {
  return (
    <View style={[styles.container, style]}>
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
