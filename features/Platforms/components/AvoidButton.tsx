import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { TRACK_BUTTON_WIDTH, TRACK_BUTTON_HEIGHT } from '../../../config/constants';

interface AvoidButtonProps {
  /** Whether the platform has been avoided today. Drives label + color swap. */
  avoidedToday: boolean;
  /** Platform display name for a11y labels. */
  platformName: string;
  onPress: () => void;
}

/**
 * ONE button, TWO visual states. Label and colors swap based on avoidedToday.
 * Same position, same size, same component instance at all times.
 *
 * State A (not avoided): "AVOID" — amber bg, raised bevel, white text
 * State B (avoided):     "✓"     — deep green bg, inset bevel, green text
 */
export function AvoidButton({ avoidedToday, platformName, onPress }: AvoidButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, avoidedToday ? styles.buttonDone : styles.buttonActive]}
      accessibilityRole="button"
      accessibilityLabel={
        avoidedToday
          ? platformsCopy.avoidedBtnA11y(platformName)
          : platformsCopy.avoidBtnA11y(platformName)
      }
      accessibilityState={{ selected: avoidedToday }}
      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <Text
        style={[styles.label, avoidedToday ? styles.labelDone : styles.labelActive]}
        allowFontScaling={false}
      >
        {avoidedToday ? platformsCopy.avoidedBtn : platformsCopy.avoidBtn}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: TRACK_BUTTON_WIDTH,
    height: TRACK_BUTTON_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.button,
  },
  buttonActive: {
    backgroundColor: theme.colors.focusAccent,
  },
  buttonDone: {
    backgroundColor: theme.colors.successGreenDeep,
  },
  label: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: theme.type.caption.fontSize,
    lineHeight: theme.type.caption.lineHeight,
    letterSpacing: 0.8,
  },
  labelActive: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  labelDone: {
    color: theme.colors.successGreenText,
    fontSize: theme.type.displayS.fontSize,
    fontFamily: theme.fonts.headline,
  },
});
