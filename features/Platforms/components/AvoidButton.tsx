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
 * State A (not avoided): "AVOID" — bright green bg, white text
 * State B (avoided):     "✓"     — muted green bg, green text
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
    borderWidth: theme.borders.standard.width,
  },
  buttonActive: {
    backgroundColor: '#2d8a4e',
    borderColor: '#2d8a4e',
  },
  buttonDone: {
    backgroundColor: '#1a3a1a',
    borderColor: '#1a3a1a',
  },
  label: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    letterSpacing: 1,
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  labelDone: {
    color: '#5ab55a',
    fontSize: 18,
    fontFamily: theme.fonts.headline,
  },
});
