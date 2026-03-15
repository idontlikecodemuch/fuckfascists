import React, { useState, useRef, useEffect } from 'react';
import { Animated, Pressable, Text, StyleSheet, AccessibilityInfo } from 'react-native';

interface AvoidButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
}

/**
 * Primary action button on the business card.
 *
 * Renders once as "AVOIDED" then flips to a confirmed state after the
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

  const label = error ? 'Try again' : confirmed ? '\u2713 AVOIDED' : 'AVOIDED';
  const accessLabel = error ? 'Avoid failed — try again' : confirmed ? 'Avoided — confirmed' : 'Mark as avoided';

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
    backgroundColor: '#3CB371',
    borderColor: '#1E5C3A',
    borderWidth: 4,
    minHeight: 44,
    minWidth: 44,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmed: {
    backgroundColor: '#228B22',
    borderColor: '#0D3D16',
  },
  errored: {
    backgroundColor: '#CC7A00',
    borderColor: '#7A4800',
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
