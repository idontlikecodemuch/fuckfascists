import React, { useEffect, useRef } from 'react';
import { Animated, AccessibilityInfo, StyleSheet } from 'react-native';
import { theme } from '../../design/tokens';

const SPARKS = [
  { char: '\u2726', size: 10, top: -4, right: 12, delay: 0 },
  { char: '\u2727', size: 8, top: 6, right: 4, delay: 300 },
  { char: '\u2726', size: 7, top: -2, right: 24, delay: 600 },
] as const;

const LARGE_SPARKS = [
  { char: '\u2726', size: 16, top: -6, right: 16, delay: 0 },
  { char: '\u2727', size: 13, top: 8, right: 6, delay: 250 },
  { char: '\u2726', size: 12, top: -4, right: 32, delay: 500 },
  { char: '\u2727', size: 18, top: 4, right: 48, delay: 750 },
  { char: '\u2726', size: 14, top: -2, right: 22, delay: 400 },
] as const;

// Info about plaque — 5 sparks spread across four edges, sizes 10-14px.
// Uses negative right values to place sparks on the left side of parent.
const INFO_SPARKS = [
  { char: '\u2726', size: 12, top: -6, right: 20, delay: 0 },      // top-right
  { char: '\u2727', size: 10, top: -4, right: 200, delay: 200 },    // top-left area
  { char: '\u2726', size: 14, top: 120, right: 8, delay: 400 },     // bottom-right area
  { char: '\u2727', size: 11, top: 100, right: 220, delay: 600 },   // bottom-left area
  { char: '\u2726', size: 13, top: 50, right: -6, delay: 300 },     // mid-right edge
] as const;

const CYCLE_MS = 1200;

interface SparkleDecorationProps {
  /** 'large' uses 5 sparks at 12–18px. 'info' spreads 5 sparks (10-14px) across all edges. */
  variant?: 'default' | 'large' | 'info';
}

/**
 * Ambient sparkle decoration. Animated text elements rendering alternating stars
 * in rewardYellow. Positioned absolute near top-right of parent.
 * Parent needs overflow: 'visible'.
 *
 * Reduced motion: static sparks at 0.6 opacity, no animation.
 */
export function SparkleDecoration({ variant = 'default' }: SparkleDecorationProps) {
  const sparks = variant === 'info' ? INFO_SPARKS : variant === 'large' ? LARGE_SPARKS : SPARKS;
  const reducedMotion = useRef(false);
  const anims = useRef(sparks.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      reducedMotion.current = enabled;
      if (enabled) {
        anims.forEach((a) => a.setValue(0.5));
        return;
      }

      anims.forEach((anim, i) => {
        const loop = Animated.loop(
          Animated.sequence([
            Animated.delay(sparks[i]!.delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: CYCLE_MS / 2,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: CYCLE_MS / 2,
              useNativeDriver: true,
            }),
          ]),
        );
        loop.start();
      });
    });

    return () => {
      cancelled = true;
      anims.forEach((a) => a.stopAnimation());
    };
  }, [anims, sparks]);

  return (
    <>
      {sparks.map((spark, i) => {
        const opacity = anims[i]!.interpolate({
          inputRange: [0, 1],
          outputRange: [0.2, 1.0],
        });
        const scale = anims[i]!.interpolate({
          inputRange: [0, 1],
          outputRange: [0.7, 1.2],
        });

        return (
          <Animated.Text
            key={i}
            style={[
              styles.spark,
              {
                fontSize: spark.size,
                top: spark.top,
                right: spark.right,
                opacity,
                transform: [{ scale }],
              },
            ]}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {spark.char}
          </Animated.Text>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  spark: {
    position: 'absolute',
    color: theme.colors.rewardYellow,
    pointerEvents: 'none',
  },
});
