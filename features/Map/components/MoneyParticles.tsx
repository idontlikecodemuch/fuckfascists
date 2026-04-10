import React, { useRef, useEffect, useState } from 'react';
import { Animated, View, StyleSheet, AccessibilityInfo } from 'react-native';
import { PARTICLE_COUNT, PARTICLE_DURATION_MS } from '../../../config/constants';
import { theme } from '../../../design/tokens';
import { cashBills } from '../../../core/ui/uiAssets';

interface MoneyParticlesProps {
  /** Vertical origin offset from the top of the parent (sprite area). */
  originY?: number;
}

/** Build deterministic spread for each particle. */
function makeParticles(count: number) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 0.3) + (Math.PI * 0.4 * i / count);
    const speed = 80 + (i % 3) * 40;
    particles.push({
      dx: Math.cos(angle) * speed * (i % 2 === 0 ? 1 : -1),
      dy: -(Math.sin(angle) * speed),
      gravity: 200 + (i % 4) * 30,
      billIndex: i % cashBills.length,
      rotation: `${-15 + (i * 37) % 30}deg`,
    });
  }
  return particles;
}

/**
 * Pixel art dollar bills that burst from the sprite area after an avoid tap.
 *
 * Uses 4 bill sprite variants (cashBills) cycled per particle, each with a
 * random rotation. Arc outward with gravity and fade over ~800ms.
 * All animations native-driven (translateX, translateY, opacity).
 *
 * Reduced motion: skip entirely (renders nothing).
 */
export function MoneyParticles({ originY = 0 }: MoneyParticlesProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const particles = useRef(makeParticles(PARTICLE_COUNT)).current;
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
        Animated.timing(a.x, { toValue: p.dx, duration: PARTICLE_DURATION_MS, useNativeDriver: true }),
        Animated.sequence([
          Animated.timing(a.y, { toValue: p.dy, duration: PARTICLE_DURATION_MS * 0.3, useNativeDriver: true }),
          Animated.timing(a.y, { toValue: p.gravity, duration: PARTICLE_DURATION_MS * 0.7, useNativeDriver: true }),
        ]),
        Animated.timing(a.opacity, { toValue: 0, duration: PARTICLE_DURATION_MS, useNativeDriver: true }),
      ]);
    });

    Animated.parallel(animations).start();
  }, [reducedMotion, anims, particles]);

  if (reducedMotion) return null;

  return (
    <View style={[styles.container, { top: originY }]} pointerEvents="none" accessibilityElementsHidden>
      {particles.map((p, i) => (
        <Animated.Image
          key={i}
          source={cashBills[p.billIndex]}
          style={[
            styles.bill,
            {
              transform: [
                { translateX: anims[i].x },
                { translateY: anims[i].y },
                { rotate: p.rotation },
              ],
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
  bill: {
    position: 'absolute',
    width: 24,
    height: 18,
    resizeMode: 'contain',
  },
});
