import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';

interface PreviewStampProps {
  /**
   * Visual scale multiplier. Use 1 for in-app UI overlays, and a larger
   * multiplier inside the rendered-card canvas (ScorecardImage) where the
   * stamp needs to read proportionally on a 1080×1920 bitmap. Defaults to 1.
   */
  scale?: number;
}

/**
 * Pixel art rubber-stamp overlay shown on on-demand (non-official-drop) cards.
 * Positioned absolutely over the top-right corner of the card.
 * Reduced-motion safe — no animation, pure static style.
 */
export function PreviewStamp({ scale = 1 }: PreviewStampProps) {
  return (
    <View
      style={[
        styles.stamp,
        {
          top: 20 * scale,
          right: 8 * scale,
          paddingHorizontal: 10 * scale,
          paddingVertical: 4 * scale,
          borderWidth: theme.borders.standard.width * scale,
        },
      ]}
      accessibilityLabel={scorecardCopy.previewA11y}
      importantForAccessibility="yes"
    >
      <Text
        style={[
          styles.text,
          { fontSize: 14 * scale, letterSpacing: 3 * scale },
        ]}
        allowFontScaling={false}
      >
        {scorecardCopy.previewStamp}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    position:        'absolute',
    backgroundColor: 'rgba(7, 11, 18, 0.8)', // theme.colors.bgVoid (#070B12) at 80%
    borderColor:     theme.colors.rewardYellow,
    transform:       [{ rotate: '12deg' }],
  },
  text: {
    fontFamily:  theme.fonts.headline,
    fontWeight:  'bold',
    color:       theme.colors.rewardYellow,
  },
});
