import React, { useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';

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
 * Reduced-motion: no animation — state change is immediate.
 */
export function AvoidButton({ onPress, disabled = false }: AvoidButtonProps) {
  const [confirmed, setConfirmed] = useState(false);

  async function handlePress() {
    if (confirmed || disabled) return;
    setConfirmed(true);
    await onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={confirmed || disabled}
      style={[styles.button, confirmed && styles.confirmed]}
      accessibilityRole="button"
      accessibilityLabel={confirmed ? 'Avoided — confirmed' : 'Mark as avoided'}
      accessibilityState={{ disabled: confirmed || disabled }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <Text style={styles.label} allowFontScaling>
        {confirmed ? '\u2713 AVOIDED' : 'AVOIDED'}
      </Text>
    </Pressable>
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
  label: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
