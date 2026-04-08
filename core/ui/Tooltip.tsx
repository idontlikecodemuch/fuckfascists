import React from 'react';
import { Animated, View, Text, Platform, StyleSheet, type ViewStyle } from 'react-native';
import { theme } from '../../design/tokens';
import { useWiggleAnimation } from './useWiggleAnimation';

const DEPTH_OFFSET = 3;
const TAIL_SIZE = 10;

interface TooltipProps {
  message: string;
  /** Direction the tail triangle points. null = no tail. */
  tailDirection?: 'up' | 'down' | null;
  /** Horizontal offset of the tail from the left edge, in px. */
  tailOffset?: number;
  /** Positioning style applied by the parent. */
  style?: ViewStyle;
}

/**
 * Reusable speech-bubble tooltip with a Mario-cloud depth effect.
 *
 * White face with a warm grey shape offset behind and to the bottom-right,
 * creating shading on the bottom and right edges only.
 * Optional directional tail (plain white triangle, no shadow).
 * Gentle wiggle animation; respects reduced motion.
 *
 * This is a presentational component — the parent handles dismissal.
 */
export function Tooltip({ message, tailDirection, tailOffset, style }: TooltipProps) {
  const { translateY, rotate, scale } = useWiggleAnimation();

  const tailMarginLeft = tailOffset ?? TAIL_SIZE * 2;

  return (
    <Animated.View
      style={[style, { transform: [{ translateY }, { rotate }, { scale }] }]}
      pointerEvents="none"
      accessibilityRole="alert"
    >
      {tailDirection === 'up' && (
        <View style={[styles.tailUp, { marginLeft: tailMarginLeft }]} />
      )}

      <View style={styles.body}>
        {/* Depth shape — warm grey, offset behind the white face */}
        <View style={styles.depthShape} />
        {/* White face — on top */}
        <View style={styles.faceShape}>
          <Text style={styles.text} allowFontScaling>{message}</Text>
        </View>
      </View>

      {tailDirection === 'down' && (
        <View style={[styles.tailDown, { marginLeft: tailMarginLeft }]} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  body: {
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  depthShape: {
    position: 'absolute',
    top: DEPTH_OFFSET,
    left: DEPTH_OFFSET,
    right: -DEPTH_OFFSET,
    bottom: -DEPTH_OFFSET,
    backgroundColor: theme.colors.tooltipShadow,
    borderRadius: theme.radii.tooltip,
  },
  faceShape: {
    backgroundColor: theme.colors.tooltipFace,
    borderRadius: theme.radii.tooltip,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.lg,
  },
  text: {
    ...theme.type.bodyS,
    color: theme.colors.bgVoid,
    lineHeight: 18,
  },
  tailUp: {
    width: 0,
    height: 0,
    borderLeftWidth: TAIL_SIZE,
    borderRightWidth: TAIL_SIZE,
    borderBottomWidth: TAIL_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: theme.colors.tooltipFace,
  },
  tailDown: {
    width: 0,
    height: 0,
    borderLeftWidth: TAIL_SIZE,
    borderRightWidth: TAIL_SIZE,
    borderTopWidth: TAIL_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: theme.colors.tooltipFace,
  },
});
