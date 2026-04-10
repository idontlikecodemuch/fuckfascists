/**
 * Combined tilt (accelerometer) + scroll parallax for StarFieldBg.
 *
 * Tilt uses reanimated's useAnimatedSensor (UI thread, no bridge overhead).
 * Scroll accepts an optional SharedValue<number> from the consumer's
 * useAnimatedScrollHandler.
 *
 * Returns animated styles for three depth layers (bg, mid, fg).
 * When disabled, all offsets stay at 0 — static positions, still looks great.
 */

import {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedSensor,
  SensorType,
  withSpring,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import {
  STARBG_PARALLAX_TILT_MAX_OFFSET,
  STARBG_TILT_DEAD_ZONE,
  STARBG_PITCH_BOOST,
  STARBG_PARALLAX_SCROLL_RATE_BG,
  STARBG_PARALLAX_SCROLL_RATE_MID,
  STARBG_PARALLAX_SCROLL_RATE_FG,
  STARBG_PARALLAX_TILT_RATE_BG,
  STARBG_PARALLAX_TILT_RATE_MID,
  STARBG_PARALLAX_TILT_RATE_FG,
} from './starbgConstants';

const SPRING_CONFIG = { damping: 20, stiffness: 90, mass: 0.5 };

export function useParallax(
  enabled: boolean,
  scrollY?: SharedValue<number>,
) {
  const sensor = useAnimatedSensor(SensorType.ROTATION, { interval: 100 });

  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);

  // Always create the fallback — hooks must be called unconditionally.
  // If scrollY is provided, this value is unused but stable.
  const fallbackScrollY = useSharedValue(0);
  const effectiveScrollY = scrollY ?? fallbackScrollY;

  useDerivedValue(() => {
    if (!enabled) return;
    const { qx, qy, qw, qz } = sensor.sensor.value;
    const roll = Math.atan2(2 * (qw * qx + qy * qz), 1 - 2 * (qx * qx + qy * qy));
    const pitch = Math.asin(Math.max(-1, Math.min(1, 2 * (qw * qy - qz * qx))));

    const filteredRoll = Math.abs(roll) < STARBG_TILT_DEAD_ZONE ? 0 : roll;
    const filteredPitch = Math.abs(pitch) < STARBG_TILT_DEAD_ZONE ? 0 : pitch;

    const maxOff = STARBG_PARALLAX_TILT_MAX_OFFSET;
    tiltX.value = withSpring(
      Math.max(-maxOff, Math.min(maxOff, filteredRoll * maxOff * 2)),
      SPRING_CONFIG,
    );
    tiltY.value = withSpring(
      Math.max(-maxOff, Math.min(maxOff, filteredPitch * maxOff * 2 * STARBG_PITCH_BOOST)),
      SPRING_CONFIG,
    );
  }, [enabled]);

  const bgStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltX.value * STARBG_PARALLAX_TILT_RATE_BG },
      { translateY: tiltY.value * STARBG_PARALLAX_TILT_RATE_BG - effectiveScrollY.value * STARBG_PARALLAX_SCROLL_RATE_BG },
    ],
  }));

  const midStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltX.value * STARBG_PARALLAX_TILT_RATE_MID },
      { translateY: tiltY.value * STARBG_PARALLAX_TILT_RATE_MID - effectiveScrollY.value * STARBG_PARALLAX_SCROLL_RATE_MID },
    ],
  }));

  const fgStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tiltX.value * STARBG_PARALLAX_TILT_RATE_FG },
      { translateY: tiltY.value * STARBG_PARALLAX_TILT_RATE_FG - effectiveScrollY.value * STARBG_PARALLAX_SCROLL_RATE_FG },
    ],
  }));

  return { bgStyle, midStyle, fgStyle };
}
