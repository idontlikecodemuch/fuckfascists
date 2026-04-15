import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';

interface EmptyWeekProps {
  onSwitchTab?: (tab: string) => void;
}

/**
 * State 4: Zero avoids at drop time — no card generated, no notification fired.
 * Amber motivational copy with links to Map and Track.
 */
export function EmptyWeek({ onSwitchTab }: EmptyWeekProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text} allowFontScaling={false}>
        {scorecardCopy.emptyState.split('\n').map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && '\n'}
            {line}
          </React.Fragment>
        ))}
      </Text>
      {onSwitchTab && (
        <View style={styles.links}>
          <Text
            style={styles.link}
            onPress={() => onSwitchTab('map')}
            accessibilityRole="link"
          >
            Map
          </Text>
          <Text style={styles.dot}>{'\u00b7'}</Text>
          <Text
            style={styles.link}
            onPress={() => onSwitchTab('platforms')}
            accessibilityRole="link"
          >
            Track
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.space['4xl'],
  },
  text: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 16,
    color: theme.colors.amberActionLight,
    textAlign: 'center',
    lineHeight: 26,
    letterSpacing: 1,
  },
  links: {
    flexDirection: 'row',
    marginTop: theme.space.lg,
    gap: theme.space.sm,
  },
  link: {
    fontFamily: theme.fonts.headline,
    fontSize: 14,
    color: theme.colors.rewardYellow,
    textDecorationLine: 'underline',
  },
  dot: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
});
