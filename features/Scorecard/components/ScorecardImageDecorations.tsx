import React from 'react';
import { PixelRatio, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../design/tokens';

const pr = PixelRatio.get();
const scale = (px: number) => px / pr;

const SPARKLE_GLYPH = '✦';
const SPARKLE_GLYPH_SM = '✧';

const CORNER_TICK_DESIGN = 18;
const CORNER_TICK_BORDER = 2;

// ── Beam — horizontal light-rule with cyan glow ───────────────────────────
// Approximation of the design's horizontal gradient (transparent → blue →
// cyan → white core → cyan → blue → transparent). RN has no native linear
// gradient without a third-party lib, so we render a thin solid-cyan core
// with a stacked cyan + blue boxShadow that reads as a glowing rule against
// the dark starfield. Width passed in design-space pixels (already scaled).
export function Beam({ width }: { width: number }) {
  return (
    <View
      style={[styles.beam, { width }]}
      collapsable={false}
    />
  );
}

// ── CornerTick — cyan L-bracket on panel corners ──────────────────────────
// Each tick renders two perpendicular borders forming an L. Position is
// nudged 3px outside the panel edge so the bracket sits on the seam.
export function CornerTick({ edge }: { edge: 'tl' | 'tr' | 'bl' | 'br' }) {
  const isTop = edge === 'tl' || edge === 'tr';
  const isLeft = edge === 'tl' || edge === 'bl';
  return (
    <View
      style={[
        styles.cornerTick,
        isTop ? styles.cornerTickTop : styles.cornerTickBottom,
        isLeft ? styles.cornerTickLeft : styles.cornerTickRight,
      ]}
      collapsable={false}
      pointerEvents="none"
    />
  );
}

// ── Sparkle — unicode 4-pointed star with cyan/gold textShadow glow ───────
// Position in 1080×1920 design space; scale() converts to logical points.
export function Sparkle({
  x,
  y,
  size,
  rotate = 0,
  opacity = 1,
  cyan = false,
  small = false,
}: {
  x: number;
  y: number;
  size: number;
  rotate?: number;
  opacity?: number;
  cyan?: boolean;
  small?: boolean;
}) {
  const color = cyan ? theme.colors.glowCyan : theme.colors.rewardYellow;
  return (
    <Text
      style={{
        position: 'absolute',
        left: scale(x),
        top: scale(y),
        fontSize: scale(size),
        color,
        opacity,
        transform: [{ rotate: `${rotate}deg` }],
        textShadowColor: color,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: scale(6),
      }}
      allowFontScaling={false}
    >
      {small ? SPARKLE_GLYPH_SM : SPARKLE_GLYPH}
    </Text>
  );
}

const styles = StyleSheet.create({
  beam: {
    height: scale(4),
    backgroundColor: 'rgba(122,242,255,0.85)',
    boxShadow: [
      { offsetX: 0, offsetY: 0, blurRadius: scale(14), spreadDistance: 0, color: 'rgba(122,242,255,0.6)' },
      { offsetX: 0, offsetY: 0, blurRadius: scale(28), spreadDistance: 0, color: 'rgba(40,120,200,0.4)' },
    ],
  },
  cornerTick: {
    position: 'absolute',
    width: scale(CORNER_TICK_DESIGN),
    height: scale(CORNER_TICK_DESIGN),
    borderColor: theme.colors.glowCyan,
    boxShadow: [
      { offsetX: 0, offsetY: 0, blurRadius: scale(8), spreadDistance: 0, color: theme.colors.glowCyan },
    ],
  },
  cornerTickTop:    { top: scale(-3),    borderTopWidth: CORNER_TICK_BORDER },
  cornerTickBottom: { bottom: scale(-3), borderBottomWidth: CORNER_TICK_BORDER },
  cornerTickLeft:   { left: scale(-3),   borderLeftWidth: CORNER_TICK_BORDER },
  cornerTickRight:  { right: scale(-3),  borderRightWidth: CORNER_TICK_BORDER },
});
