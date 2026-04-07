import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../../../design/tokens';

// ── Star field background ───────────────────────────────────────────────────
// Re-exports StarFieldBg as StarField so existing consumers keep working.
export { StarFieldBg as StarField } from '../../../core/starbg';

// ── Corner brackets for amber plaque ────────────────────────────────────────

const BRACKET_SIZE = 12;
const BRACKET_INSET = 6;

export function CornerBrackets() {
  const base = {
    position: 'absolute' as const,
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    borderColor: theme.colors.amberActionDark,
  };
  return (
    <>
      <View pointerEvents="none" style={[base, { top: BRACKET_INSET, left: BRACKET_INSET, borderTopWidth: 2, borderLeftWidth: 2 }]} />
      <View pointerEvents="none" style={[base, { top: BRACKET_INSET, right: BRACKET_INSET, borderTopWidth: 2, borderRightWidth: 2 }]} />
      <View pointerEvents="none" style={[base, { bottom: BRACKET_INSET, left: BRACKET_INSET, borderBottomWidth: 2, borderLeftWidth: 2 }]} />
      <View pointerEvents="none" style={[base, { bottom: BRACKET_INSET, right: BRACKET_INSET, borderBottomWidth: 2, borderRightWidth: 2 }]} />
    </>
  );
}

// ── Neon rule divider ───────────────────────────────────────────────────────

export function NeonRule() {
  return (
    <View style={neonStyles.container}>
      <View style={neonStyles.dot} />
      <View style={neonStyles.bar}>
        <View style={neonStyles.highlight} />
      </View>
      <View style={neonStyles.dot} />
    </View>
  );
}

const neonStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginHorizontal: theme.space.xl, marginVertical: theme.space.md },
  bar: { flex: 1, height: 3, backgroundColor: theme.colors.focusAccent },
  highlight: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: theme.colors.highlightBlue },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.colors.focusAccent },
});
