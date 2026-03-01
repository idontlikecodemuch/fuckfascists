import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Pixel art rubber-stamp overlay shown on on-demand (non-official-drop) cards.
 * Positioned absolutely over the top-right corner of the card.
 * Reduced-motion safe — no animation, pure static style.
 */
export function PreviewStamp() {
  return (
    <View
      style={styles.stamp}
      accessibilityLabel="Preview — this is not the official weekly drop"
      importantForAccessibility="yes"
    >
      <Text style={styles.text}>PREVIEW</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    position:        'absolute',
    top:             20,
    right:           -10,
    backgroundColor: 'transparent',
    borderWidth:     3,
    borderColor:     '#CC7A00',
    paddingHorizontal: 10,
    paddingVertical:   4,
    transform:       [{ rotate: '12deg' }],
  },
  text: {
    fontFamily:  'monospace',
    fontSize:    14,
    fontWeight:  'bold',
    color:       '#CC7A00',
    letterSpacing: 3,
  },
});
