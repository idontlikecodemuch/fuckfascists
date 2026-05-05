import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';
import { theme } from '../../design/tokens';

interface PulseRingProps {
  inset: number;
  borderWidth: number;
  baseOpacity: number;
  delayMs: number;
  color: string;
  cycleMs?: number;
}

export function PulseRing({
  inset,
  borderWidth,
  baseOpacity,
  delayMs,
  color,
  cycleMs = 2400,
}: PulseRingProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      if (enabled) { anim.setValue(0.5); return; }
      Animated.loop(Animated.sequence([
        Animated.delay(delayMs),
        Animated.timing(anim, { toValue: 1, duration: cycleMs / 2, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: cycleMs / 2, useNativeDriver: true }),
      ])).start();
    });
    return () => { cancelled = true; anim.stopAnimation(); };
  }, [anim, cycleMs, delayMs]);

  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3 * baseOpacity, baseOpacity] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.01] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: -inset,
        left: -inset,
        right: -inset,
        bottom: -inset,
        borderWidth,
        borderColor: color,
        borderRadius: theme.radii.button + inset,
        opacity,
        transform: [{ scale }],
      }}
      pointerEvents="none"
    />
  );
}
