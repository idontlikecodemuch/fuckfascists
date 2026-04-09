import React, { useRef, useEffect, useState } from 'react';
import { Animated, View, StyleSheet, AccessibilityInfo, useWindowDimensions } from 'react-native';
import { PARTICLE_COUNT, PARTICLE_DURATION_MS } from '../../../config/constants';
import { theme } from '../../../design/tokens';

interface MoneyParticlesProps {
  /** Vertical origin offset from the top of the parent (sprite area). */
  originY?: number;
}

/** Seed a deterministic-ish particle spread. */
function makeParticles(count: number, screenWidth: number) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 0.3) + (Math.PI * 0.4 * i / count); // spread arc
    const speed = 80 + (i % 3) * 40;
    particles.push({
      dx: Math.cos(angle) * speed * (i % 2 === 0 ? 1 : -1),
      dy: -(Math.sin(angle) * speed), // upward
      gravity: 200 + (i % 4) * 30,
      size: 6 + (i % 3) * 2,
      color: i % 3 === 0
        ? theme.colors.rewardYellow
        : i % 3 === 1
          ? theme.colors.successGreen
          : theme.colors.stampRed,
    });
  }
  return particles;
}

/**
 * Pixel money particles that burst from the sprite area.
 *
 * 8-12 small colored rectangles that arc outward with gravity and fade.
 * All animations native-driven (translateX, translateY, opacity).
 * Placeholder for pixel art money assets.
 *
 * Reduced motion: skip entirely (renders nothing).
 */
export function MoneyParticles({ originY = 0 }: MoneyParticlesProps) {
  const { width: screenWidth } = useWindowDimensions();
  const [reducedMotion, setReducedMotion] = useState(false);
  const particles = useRef(makeParticles(PARTICLE_COUNT, screenWidth)).current;
  const anims = useRef(
    particles.map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
    })),
  ).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReducedMotion(enabled);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const animations = anims.map((a, i) => {
      const p = particles[i];
      return Animated.parallel([
        // Horizontal drift
        Animated.timing(a.x, {
          toValue: p.dx,
          duration: PARTICLE_DURATION_MS,
          useNativeDriver: true,
        }),
        // Vertical: up then gravity pulls down
        Animated.sequence([
          Animated.timing(a.y, {
            toValue: p.dy,
            duration: PARTICLE_DURATION_MS * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(a.y, {
            toValue: p.gravity,
            duration: PARTICLE_DURATION_MS * 0.7,
            useNativeDriver: true,
          }),
        ]),
        // Fade out
        Animated.timing(a.opacity, {
          toValue: 0,
          duration: PARTICLE_DURATION_MS,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.parallel(animations).start();
  }, [reducedMotion, anims, particles]);

  if (reducedMotion) return null;

  return (
    <View style={[styles.container, { top: originY }]} pointerEvents="none" accessibilityElementsHidden>
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              transform: [{ translateX: anims[i].x }, { translateY: anims[i].y }],
              opacity: anims[i].opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: theme.space.lg + 40,
    zIndex: 20,
  },
  particle: {
    position: 'absolute',
    borderRadius: 1,
  },
});
