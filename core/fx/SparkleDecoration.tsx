import React, { useEffect, useRef } from 'react';
import { Animated, AccessibilityInfo, StyleSheet } from 'react-native';
import { theme } from '../../design/tokens';

const SPARKS = [
  { char: '\u2726', size: 10, top: -4, right: 12, delay: 0 },
  { char: '\u2727', size: 8, top: 6, right: 4, delay: 300 },
  { char: '\u2726', size: 7, top: -2, right: 24, delay: 600 },
] as const;

const CYCLE_MS = 1200;

/**
 * Ambient sparkle decoration. 3 small animated text elements rendering
 * alternating stars in rewardYellow. Positioned absolute near top-right
 * of parent. Parent needs overflow: 'visible'.
 *
 * Reduced motion: static sparks at 0.6 opacity, no animation.
 */
export function SparkleDecoration() {
  const reducedMotion = useRef(false);
  const anims = useRef(SPARKS.map(() => new Animated.Value(0))).current;

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
            Animated.delay(SPARKS[i]!.delay),
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
  }, [anims]);

  return (
    <>
      {SPARKS.map((spark, i) => {
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
