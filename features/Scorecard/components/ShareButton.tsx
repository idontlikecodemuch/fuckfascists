import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet } from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';

interface ShareButtonProps {
  width: number;
  onPress: () => void;
}

const PULSE_CYCLE_MS = 2200;

/**
 * Glowing SHARE word — primary share affordance for the scorecard trophy
 * moment. No button frame; just a tappable cyan-glowing wordmark sitting
 * at the bottom of the runway. Swipe-up gesture is the canonical activation;
 * tap also works for users who don't discover the swipe.
 *
 * Subtle opacity pulse on a slow cycle. Reduced motion: holds steady.
 */
export function ShareButton({ width, onPress }: ShareButtonProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      if (enabled) {
        setReducedMotion(true);
        return;
      }
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 0.55,
            duration: PULSE_CYCLE_MS / 2,
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 1,
            duration: PULSE_CYCLE_MS / 2,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
    return () => {
      cancelled = true;
      pulse.stopAnimation();
    };
  }, [pulse]);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.hit, { width }]}
      accessibilityRole="button"
      accessibilityLabel={scorecardCopy.shareLabel}
      accessibilityHint={scorecardCopy.shareHint}
    >
      <Animated.Text
        style={[styles.label, { opacity: reducedMotion ? 0.85 : pulse }]}
        allowFontScaling={false}
      >
        {scorecardCopy.shareBtn}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    // Top-align the SHARE text inside the tap area so it sits close to the
    // chevrons above. The empty space below preserves the a11y tap target
    // (≥44pt) without pushing the visible word away from the runway.
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 0,
  },
  label: {
    fontFamily: theme.fonts.headline,
    fontSize: 18,
    color: theme.colors.glowCyan,
    letterSpacing: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(122, 242, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
