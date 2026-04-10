import React, { useState, useRef, useEffect } from 'react';
import { Animated, Pressable, Text, View, StyleSheet, AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { bevelFocusRaised, bevelGreenInset } from '../../../design/bevel';
import { SparkleDecoration } from '../../../core/fx';

interface AvoidButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
  /** When true, button renders in confirmed (✓ AVOIDED) state immediately. */
  initialConfirmed?: boolean;
}

/**
 * Full-width AVOID button — cyan cockpit instrument overlaying the manila folder.
 *
 * Uses focusAccent/focusBevel system (blue). SparkleDecoration pre-avoid.
 * Post-avoid: green inset ✓ AVOIDED (unchanged).
 */
export function AvoidButton({ onPress, disabled = false, initialConfirmed = false }: AvoidButtonProps) {
  const [confirmed, setConfirmed] = useState(initialConfirmed);
  const [error, setError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Sync confirmed state when initialConfirmed changes (hydration on card reopen)
  useEffect(() => { if (initialConfirmed) setConfirmed(true); }, [initialConfirmed]);

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

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
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }], opacity: flashAnim }]}>
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
      {!confirmed && !error && <SparkleDecoration variant="default" />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { overflow: 'visible' as const },
  button: {
    ...bevelFocusRaised,
    backgroundColor: theme.colors.focusAccent,
    borderRadius: theme.radii.button,
    minHeight: 56,
    paddingVertical: theme.space.md,
    paddingHorizontal: theme.space.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmed: {
    ...bevelGreenInset,
    backgroundColor: theme.colors.successGreenDeep,
  },
  errored: {
    backgroundColor: theme.colors.dangerRed,
    borderColor: theme.colors.bgVoid,
  },
  label: {
    ...theme.type.displayM,
    color: theme.colors.textPrimary,
    letterSpacing: 3,
  },
  labelConfirmed: {
    ...theme.type.displayS,
    color: theme.colors.successGreenText,
    letterSpacing: 2,
  },
});
