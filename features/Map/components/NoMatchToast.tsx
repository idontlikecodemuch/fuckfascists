import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mapCopy } from '../../../copy/map';
import { bevelFocusRaised } from '../../../design/bevel';
import { theme } from '../../../design/tokens';

const GLYPH_SIZE = 14;

/**
 * Brief toast shown when a map tap yields no entity matches.
 * Cockpit cyan HUD pill — panelInner bg, cyan bevel, subtle outer glow.
 * Auto-dismissed by the parent via the tapNoMatch flag from useTapSearch.
 */
export function NoMatchToast() {
  return (
    <View style={styles.outer} pointerEvents="none">
      <View
        style={styles.pill}
        accessibilityRole="alert"
        accessibilityLabel={mapCopy.tapNoMatchA11y}
      >
        <Ionicons
          name="folder-outline"
          size={GLYPH_SIZE}
          color={theme.colors.focusAccent}
          style={styles.glyph}
        />
        <Text style={styles.text} allowFontScaling>
          {mapCopy.tapNoMatch}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center',
    shadowColor: theme.colors.focusAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  pill: {
    ...bevelFocusRaised,
    backgroundColor: theme.colors.panelInner,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.md,
  },
  glyph: {
    marginRight: theme.space.xs,
  },
  text: {
    ...theme.type.bodyS,
    color: theme.colors.textPrimary,
  },
});
