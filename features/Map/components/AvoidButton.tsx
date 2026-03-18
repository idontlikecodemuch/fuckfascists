import React, { useState, useRef, useEffect } from 'react';
import { Animated, Pressable, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

interface AvoidButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
}

/**
 * Full-width AVOID button — the primary action on the business card.
 *
 * Celebration sequence on confirm:
 *  1. Text flips to "AVOIDED" with checkmark
 *  2. Scale punch (1 → 1.08 → 1) over ~200ms
 *  3. Brief opacity pulse (flash)
 *  4. Haptic impact (medium)
 *  5. Settles to green confirmed state after ~1.5s
 *
 * Reduced-motion: animation + haptics disabled — state change is immediate.
 * Minimum tap target: 44×44pt (Apple HIG / WCAG 2.5.5).
 */
export function AvoidButton({ onPress, disabled = false }: AvoidButtonProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const flashAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReducedMotion(enabled);
    });
    return () => { cancelled = true; };
  }, []);

  async function handlePress() {
    if (confirmed || disabled) return;
    setConfirmed(true);
    setError(false);

    if (!reducedMotion) {
      // Haptic feedback — console.log for device verification
      console.log('[AvoidButton] Firing haptic feedback');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

      // Scale punch + flash pulse
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.08, duration: 100, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 0.7, duration: 80, useNativeDriver: true }),
          Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]),
      ]).start();
    }

    try {
      await onPress();
    } catch {
      setConfirmed(false);
      setError(true);
      scaleAnim.setValue(1);
      flashAnim.setValue(1);
    }
  }

  const label = error ? mapCopy.avoidRetry : confirmed ? mapCopy.avoidConfirmed : mapCopy.avoidLabel;
  const accessLabel = error ? mapCopy.avoidRetryLabel : confirmed ? mapCopy.avoidDoneLabel : mapCopy.avoidMarkLabel;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: flashAnim }}>
      <Pressable
        onPress={handlePress}
        disabled={confirmed || disabled}
        style={[styles.button, confirmed && styles.confirmed, error && styles.errored]}
        accessibilityRole="button"
        accessibilityLabel={accessLabel}
        accessibilityState={{ disabled: confirmed || disabled }}
      >
        <Text style={[styles.label, confirmed && styles.labelConfirmed]} allowFontScaling>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.rewardYellow,
    borderColor: theme.colors.bgVoid,
    borderWidth: theme.borders.hero.width,
    borderTopColor: theme.colors.bgVoid,
    borderTopWidth: theme.borders.standard.width,
    borderBottomColor: theme.colors.highlightBlue,
    borderBottomWidth: theme.borders.standard.width,
    minHeight: 56,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmed: {
    backgroundColor: theme.colors.successGreen,
    borderColor: theme.colors.bgVoid,
  },
  errored: {
    backgroundColor: theme.colors.dangerRed,
    borderColor: theme.colors.bgVoid,
  },
  label: {
    ...theme.type.displayM,
    color: theme.colors.bgVoid,
    letterSpacing: 3,
  },
  labelConfirmed: {
    ...theme.type.displayS,
    letterSpacing: 2,
  },
});
