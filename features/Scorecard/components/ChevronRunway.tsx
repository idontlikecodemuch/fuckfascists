import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { theme } from '../../../design/tokens';

interface ChevronRunwayProps {
  width: number;
  /** Chevron height in pt (the vertical extent of the `^` peak). */
  height?: number;
  /** Stroke thickness in pt. */
  stroke?: number;
  color?: string;
}

const COUNT = 3;
const PEAK_OFFSET = 10;        // px between successive chevron peaks (vertical step)
const CYCLE_MS = 1800;         // total time for one full sweep
const BASE_OPACITY = 0.9;      // peak opacity per chevron
const DIM_OPACITY = 0.18;      // resting opacity between pulses

/**
 * Three hollow `^` chevrons stacked tight. Each chevron is two thin angled
 * lines meeting at a top peak — no fill, no shape change. Pulses in order
 * via a single shared driver: bottom chevron lights up first, then middle,
 * then top, then a brief pause before repeating. Opacity-only animation.
 *
 * Reduced motion: chevrons hold at mid-opacity, no animation.
 */
export function ChevronRunway({
  width,
  height,
  stroke = 3,
  color = theme.colors.glowCyan,
}: ChevronRunwayProps) {
  const chevHeight = height ?? Math.round(width * 0.22);
  // Negative margin = overlap. We want each successive chevron's peak to sit
  // just PEAK_OFFSET pt below the previous peak — chevrons nest tightly.
  const overlap = -(chevHeight - PEAK_OFFSET);

  const [reducedMotion, setReducedMotion] = useState(false);
  const driver = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      if (enabled) {
        setReducedMotion(true);
        return;
      }
      Animated.loop(
        Animated.timing(driver, {
          toValue: COUNT + 0.5, // overrun half a step so last chevron dims before reset
          duration: CYCLE_MS,
          useNativeDriver: true,
        }),
      ).start();
    });
    return () => {
      cancelled = true;
      driver.stopAnimation();
    };
  }, [driver]);

  return (
    <View
      style={styles.stack}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: COUNT }, (_, i) => {
        // i=0 is TOP chevron; bottom chevron pulses first → top last.
        const peakStep = COUNT - i;

        const opacity = reducedMotion
          ? 0.5
          : driver.interpolate({
              inputRange: [peakStep - 1, peakStep, peakStep + 0.6],
              outputRange: [DIM_OPACITY, BASE_OPACITY, DIM_OPACITY],
              extrapolate: 'clamp',
            });

        return (
          <Animated.View
            key={i}
            style={{
              opacity,
              marginTop: i === 0 ? 0 : overlap,
            }}
          >
            <HollowChevron width={width} height={chevHeight} stroke={stroke} color={color} />
          </Animated.View>
        );
      })}
    </View>
  );
}

interface HollowChevronProps {
  width: number;
  height: number;
  stroke: number;
  color: string;
}

/** A hollow `^` shape: two angled stroke lines meeting at a top peak. */
function HollowChevron({ width, height, stroke, color }: HollowChevronProps) {
  // Each side of the chevron goes from a bottom corner up to the top center.
  // Length = hypotenuse; angle measured from horizontal.
  const halfW = width / 2;
  const lineLength = Math.sqrt(halfW * halfW + height * height);
  const angleDeg = (Math.atan2(height, halfW) * 180) / Math.PI;

  return (
    <View style={{ width, height }}>
      {/* Left arm: anchored at bottom-left, rotates up-right toward the peak. */}
      <View
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: lineLength,
          height: stroke,
          backgroundColor: color,
          transformOrigin: '0% 50%',
          transform: [{ rotate: `-${angleDeg}deg` }],
        }}
      />
      {/* Right arm: anchored at bottom-right, rotates up-left toward the peak. */}
      <View
        style={{
          position: 'absolute',
          right: 0,
          bottom: 0,
          width: lineLength,
          height: stroke,
          backgroundColor: color,
          transformOrigin: '100% 50%',
          transform: [{ rotate: `${angleDeg}deg` }],
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
