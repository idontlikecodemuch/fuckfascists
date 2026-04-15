import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';

/**
 * State 2: Brief loading state while the rendered card captures as PNG.
 * Centered text + spinner on StarField background.
 */
export function ScorecardLoader() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.rewardYellow} />
      <Text style={styles.text} allowFontScaling={false}>
        {scorecardCopy.loaderText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.space.lg,
  },
  text: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
});
