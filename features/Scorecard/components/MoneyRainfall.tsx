import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';
import {
  MONEY_RAINFALL_BILL_WIDTH,
  MONEY_RAINFALL_COUNT,
} from '../../../config/constants';
import { cashBills } from '../../../core/ui/uiAssets';

interface MoneyRainfallProps {
  screenW: number;
  screenH: number;
}

interface Bill {
  startX: number;        // pixel X position to spawn at (relative to container)
  startY: number;        // pixel Y position to spawn at (negative = above viewport)
  endY: number;          // pixel Y to fall to (just past bottom of viewport)
  delay: number;         // ms before this bill starts falling
  duration: number;      // ms to fall from startY → endY
  drift: number;         // horizontal drift in px over the fall
  rotateStart: string;   // initial rotation
  rotateEnd: string;     // final rotation (for tumble effect)
  billIndex: number;     // which sprite (cycles through cashBills)
  scale: number;         // size multiplier (slight variance for depth)
}

function makeBills(count: number, screenW: number, screenH: number): Bill[] {
  const bills: Bill[] = [];
  // Bill height ≈ width * 0.75 based on existing 24x18 ratio in MoneyParticles.
  const billH = MONEY_RAINFALL_BILL_WIDTH * 0.75;
  for (let i = 0; i < count; i++) {
    // Pseudo-random but deterministic per index so HMR doesn't reshuffle.
    const seed = (i * 9301 + 49297) % 233280;
    const r1 = (seed / 233280);
    const r2 = (((i * 7321) + 137) % 1000) / 1000;
    const r3 = (((i * 4297) + 991) % 1000) / 1000;
    const r4 = (((i * 1373) + 233) % 1000) / 1000;

    bills.push({
      startX: r1 * (screenW - MONEY_RAINFALL_BILL_WIDTH),
      startY: -billH - r2 * 200,                // staggered above viewport
      endY: screenH + billH,
      delay: r3 * 800,                          // up to 800ms stagger
      duration: 1400 + r4 * 800,                // 1400–2200ms fall
      drift: (r2 - 0.5) * 80,                   // ±40px horizontal drift
      rotateStart: `${(r1 - 0.5) * 60}deg`,     // ±30deg initial
      rotateEnd: `${(r3 - 0.5) * 180}deg`,      // ±90deg tumble
      billIndex: i % cashBills.length,
      scale: 0.85 + r4 * 0.45,                  // 0.85–1.30
    });
  }
  return bills;
}

/**
 * Falling-money burst across the full screen width. Spawns N large bills at
 * random X positions above the viewport and rains them down past the bottom
 * with a slight horizontal drift + tumble rotation. Used by the Scorecard
 * `CardPresentation` reveal — fires once on mount, stops after duration.
 *
 * Pure visual flourish — `pointerEvents="none"`, no a11y impact.
 * Reduced motion: renders nothing.
 */
export function MoneyRainfall({ screenW, screenH }: MoneyRainfallProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const bills = useMemo(
    () => makeBills(MONEY_RAINFALL_COUNT, screenW, screenH),
    [screenW, screenH],
  );
  const anims = useRef(bills.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      if (enabled) {
        setReducedMotion(true);
        return;
      }
      bills.forEach((bill, i) => {
        Animated.sequence([
          Animated.delay(bill.delay),
          Animated.timing(anims[i], {
            toValue: 1,
            duration: bill.duration,
            easing: Easing.in(Easing.quad), // accelerate as it falls
            useNativeDriver: true,
          }),
        ]).start();
      });
    });
    return () => {
      cancelled = true;
      anims.forEach((a) => a.stopAnimation());
    };
  }, [bills, anims]);

  if (reducedMotion) return null;

  return (
    <View
      style={styles.host}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {bills.map((bill, i) => (
        <Animated.Image
          key={i}
          source={cashBills[bill.billIndex]}
          style={[
            styles.bill,
            {
              left: bill.startX,
              top: bill.startY,
              width: MONEY_RAINFALL_BILL_WIDTH * bill.scale,
              height: MONEY_RAINFALL_BILL_WIDTH * 0.75 * bill.scale,
              transform: [
                {
                  translateY: anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, bill.endY - bill.startY],
                  }),
                },
                {
                  translateX: anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, bill.drift],
                  }),
                },
                {
                  rotate: anims[i].interpolate({
                    inputRange: [0, 1],
                    outputRange: [bill.rotateStart, bill.rotateEnd],
                  }),
                },
              ],
              opacity: anims[i].interpolate({
                inputRange: [0, 0.8, 1],
                outputRange: [1, 1, 0], // fade out near the end of the fall
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50, // above the card halo, below the dismiss button + chevron runway
  },
  bill: {
    position: 'absolute',
    resizeMode: 'contain',
  },
});
