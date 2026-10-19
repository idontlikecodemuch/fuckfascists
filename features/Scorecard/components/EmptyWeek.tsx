import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { PastScorecardsLink } from './PastScorecardsLink';

interface EmptyWeekProps {
  onSwitchTab?: (tab: string) => void;
  onOpenArchive?: () => void;
  /** Week of a card saved after its drop window (one-line notice). */
  lateWeek?: string | null;
}

/**
 * State 4: Zero avoids at drop time — no card generated, no notification fired.
 * Amber motivational copy with inline tappable {map}/{track} tokens.
 *
 * Token rendering matches LivePreview's EmptyHint so the same copy string
 * (scorecardCopy.emptyState) renders identically in both surfaces.
 */
export function EmptyWeek({ onSwitchTab, onOpenArchive, lateWeek }: EmptyWeekProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text} allowFontScaling={false}>
        {scorecardCopy.emptyState.split(/\{(\w+)\}/).map((part, i) => {
          if (part === 'map' || part === 'track') {
            return (
              <Text
                key={i}
                style={styles.link}
                onPress={
                  onSwitchTab
                    ? () => onSwitchTab(part === 'map' ? 'map' : 'platforms')
                    : undefined
                }
                accessibilityRole="link"
              >
                {part === 'map' ? 'Map' : 'Track'}
              </Text>
            );
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        })}
      </Text>
      {onOpenArchive && (
        <PastScorecardsLink
          style={styles.archiveLink}
          onPress={onOpenArchive}
          lateWeek={lateWeek}
        />
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
  link: {
    color: theme.colors.rewardYellow,
    textDecorationLine: 'underline',
  },
  archiveLink: {
    marginTop: theme.space.xl,
  },
});
