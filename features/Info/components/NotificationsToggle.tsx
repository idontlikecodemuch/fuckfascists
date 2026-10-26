import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAlerts } from '../../Alerts/AlertsContext';
import { infoCopy } from '../../../copy/info';
import { theme } from '../../../design/tokens';

const LABEL_FONT_SIZE = 10;
const TRACK_WIDTH = 36;
const TRACK_HEIGHT = 20;
const KNOB_SIZE = 12;
const TRACK_BORDER = 2;

/**
 * Small Notifications switch for the Info header (owner 2026-10-26: top
 * right, "people know what that means"). The knob side and color show the
 * system permission. A tap shows the iOS prompt while it can still appear,
 * otherwise opens the app's notification settings (also how they are turned
 * off: an app cannot revoke its own permission).
 */
export function NotificationsToggle() {
  const { permission, alertsOn, openControl } = useAlerts();
  const handlePress = useCallback(() => { void openControl(); }, [openControl]);

  const hint = alertsOn
    ? infoCopy.notificationsHintOn
    : permission?.status === 'ask'
      ? infoCopy.notificationsHintAsk
      : infoCopy.notificationsHintSettings;

  return (
    <Pressable
      onPress={handlePress}
      style={styles.control}
      accessibilityRole="button"
      accessibilityLabel={infoCopy.notificationsA11y}
      accessibilityValue={{ text: alertsOn ? infoCopy.notificationsOn : infoCopy.notificationsOff }}
      accessibilityHint={hint}
    >
      <Text style={styles.label} allowFontScaling numberOfLines={1}>
        {infoCopy.notificationsLabel}
      </Text>
      <View style={[styles.track, alertsOn && styles.trackOn]}>
        <View style={[styles.knob, alertsOn && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  control: {
    minHeight: theme.a11y.minTapTarget,
    minWidth: theme.a11y.minTapTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  label: {
    fontFamily: theme.fonts.headline,
    fontSize: LABEL_FONT_SIZE,
    lineHeight: LABEL_FONT_SIZE + 4,
    color: theme.colors.highlightBlue,
    letterSpacing: 1,
    marginBottom: theme.space.xs,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderWidth: TRACK_BORDER,
    borderColor: theme.colors.bevelLight,
    backgroundColor: theme.colors.panelOuter,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: (TRACK_HEIGHT - KNOB_SIZE) / 2 - TRACK_BORDER,
  },
  trackOn: {
    borderColor: theme.colors.successGreen,
    backgroundColor: theme.colors.successGreenDeep,
    alignItems: 'flex-end',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    backgroundColor: theme.colors.textSecondary,
  },
  knobOn: { backgroundColor: theme.colors.successGreen },
});
