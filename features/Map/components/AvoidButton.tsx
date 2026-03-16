import React, { useState, useRef, useEffect } from 'react';
import { Animated, Pressable, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';

interface AvoidButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
}

/**
 * Primary action button on the business card.
 *
 * Renders as "AVOID" then flips to "✓ AVOIDED" confirmed state after the
 * user taps it — the tap is the affirmative avoidance action.
 *
 * Minimum tap target: 44×44pt (Apple HIG / WCAG 2.5.5).
 * Reduced-motion: animation disabled — state change is immediate.
 */
export function AvoidButton({ onPress, disabled = false }: AvoidButtonProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Scale animation: quick punch on confirm (1 → 1.1 → 1), disabled when reduced-motion is on.
  const scaleAnim = useRef(new Animated.Value(1)).current;

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
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.12, duration: 80, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: 120, useNativeDriver: true }),
      ]).start();
    }

    try {
      await onPress();
    } catch {
      setConfirmed(false);
      setError(true);
      scaleAnim.setValue(1);
    }
  }

  const label = error ? mapCopy.avoidRetry : confirmed ? mapCopy.avoidConfirmed : mapCopy.avoidLabel;
  const accessLabel = error ? mapCopy.avoidRetryLabel : confirmed ? mapCopy.avoidDoneLabel : mapCopy.avoidMarkLabel;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        disabled={confirmed || disabled}
        style={[styles.button, confirmed && styles.confirmed, error && styles.errored]}
        accessibilityRole="button"
        accessibilityLabel={accessLabel}
        accessibilityState={{ disabled: confirmed || disabled }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.label} allowFontScaling>
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
    minHeight: 56,
    minWidth: theme.a11y.minTapTarget,
    paddingVertical: 10,
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
    ...theme.type.displayS,
    color: theme.colors.bgVoid,
    letterSpacing: 2,
  },
});
