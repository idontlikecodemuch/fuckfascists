import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

/**
 * Brief toast shown when a map tap yields no entity matches.
 * Auto-dismissed by the parent via the tapNoMatch flag from useTapSearch.
 */
export function NoMatchToast() {
  return (
    <View style={styles.toast} accessibilityRole="alert" pointerEvents="none">
      <Text style={styles.text} allowFontScaling>{mapCopy.tapNoMatch}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    backgroundColor: theme.colors.surface1,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.textSecondary,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.lg,
  },
  text: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
  },
});
