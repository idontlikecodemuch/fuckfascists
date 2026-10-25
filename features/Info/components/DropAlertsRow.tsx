import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAlerts } from '../../Alerts/AlertsContext';
import { infoCopy } from '../../../copy/info';
import { theme } from '../../../design/tokens';
import { bevelInset } from '../../../design/bevel';

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 28;
const KNOB_SIZE = 18;

/**
 * Drop alerts toggle. Shows whether notifications are allowed; a tap shows
 * the system prompt while it can still appear, otherwise opens the app's
 * Settings page (the only place an app's alerts can be switched).
 */
export function DropAlertsRow() {
  const { permission, alertsOn, openControl } = useAlerts();
  const handlePress = useCallback(() => { void openControl(); }, [openControl]);

  const hint = alertsOn
    ? infoCopy.alertsHintOn
    : permission?.status === 'ask'
      ? infoCopy.alertsHintAsk
      : infoCopy.alertsHintSettings;

  return (
    <Pressable
      onPress={handlePress}
      style={styles.row}
      accessibilityRole="switch"
      accessibilityState={{ checked: alertsOn }}
      accessibilityLabel={infoCopy.alertsLabel}
      accessibilityHint={hint}
    >
      <View style={styles.text}>
        <Text style={styles.label} allowFontScaling>{infoCopy.alertsLabel}</Text>
        <Text style={styles.detail} allowFontScaling>{infoCopy.alertsDetail}</Text>
      </View>
      <View style={styles.control}>
        <View style={[styles.track, alertsOn && styles.trackOn]}>
          <View style={[styles.knob, alertsOn && styles.knobOn]} />
        </View>
        <Text style={[styles.state, alertsOn && styles.stateOn]} allowFontScaling>
          {alertsOn ? infoCopy.alertsOn : infoCopy.alertsOff}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    ...bevelInset,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.a11y.minTapTarget,
    padding: theme.space.md,
    backgroundColor: theme.colors.panelInner,
  },
  text: { flex: 1, marginRight: theme.space.md },
  label: { ...theme.type.bodyM, color: theme.colors.textPrimary },
  detail: { ...theme.type.bodyS, color: theme.colors.textSecondary },
  control: { alignItems: 'center' },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.bevelLight,
    backgroundColor: theme.colors.panelOuter,
    justifyContent: 'center',
    paddingHorizontal: (TRACK_HEIGHT - KNOB_SIZE) / 2 - theme.borders.standard.width,
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
  state: {
    ...theme.type.caption,
    fontFamily: theme.fonts.headline,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginTop: theme.space.xs,
  },
  stateOn: { color: theme.colors.successGreenText },
});
