import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';

/**
 * Pixel art rubber-stamp overlay shown on on-demand (non-official-drop) cards.
 * Positioned absolutely over the top-right corner of the card.
 * Reduced-motion safe — no animation, pure static style.
 */
export function PreviewStamp() {
  return (
    <View
      style={styles.stamp}
      accessibilityLabel={scorecardCopy.previewA11y}
      importantForAccessibility="yes"
    >
      <Text style={styles.text}>{scorecardCopy.previewStamp}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    position:        'absolute',
    top:             20,
    right:           -10,
    backgroundColor: 'transparent',
    borderWidth:     theme.borders.standard.width,
    borderColor:     theme.colors.rewardYellow,
    paddingHorizontal: 10,
    paddingVertical:   4,
    transform:       [{ rotate: '12deg' }],
  },
  text: {
    fontFamily:  theme.fonts.headline,
    fontSize:    14,
    fontWeight:  'bold',
    color:       theme.colors.rewardYellow,
    letterSpacing: 3,
  },
});
