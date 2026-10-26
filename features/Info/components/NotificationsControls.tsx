import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  PixelRatio,
  useWindowDimensions,
  type LayoutChangeEvent,
} from 'react-native';
import { useAlerts } from '../../Alerts/AlertsContext';
import { PixelArt } from '../../../core/ui/PixelArt';
import { infoCopy } from '../../../copy/info';
import { theme } from '../../../design/tokens';
import { INFO_NOTIFICATIONS_COMPACT_MAX_FONT_SCALE } from '../../../config/constants';
import { BELL_OFF, BELL_ON, CHEVRON } from './notificationIcons';

const BASE_CELL = 2;
const VALUE_FONT_SIZE = 15;
const LEADER_DOT = 2;
const LEADER_STEP = 6;
const LEADER_OPACITY = 0.55;
const PRESSED_SHIFT = 2;

const BELL_ON_PALETTE = {
  '#': theme.colors.successGreen,
  w: theme.colors.successGreen,
  g: theme.colors.textPrimary,
} as const;
const BELL_OFF_PALETTE = { '#': theme.colors.textSecondary, k: theme.colors.bgVoid } as const;
const CHEVRON_PALETTE = { '#': theme.colors.textSecondary } as const;

/**
 * Shared state for both Info notification controls (design 2026-10-26). A tap
 * shows the iOS prompt while it can still appear, otherwise opens the app's
 * notification settings, which is also how they are turned off.
 */
function useNotificationsControl() {
  const { permission, alertsOn, openControl } = useAlerts();
  const { fontScale } = useWindowDimensions();
  const onPress = useCallback(() => { void openControl(); }, [openControl]);
  const hint = alertsOn
    ? infoCopy.notificationsHintOn
    : permission?.status === 'ask'
      ? infoCopy.notificationsHintAsk
      : infoCopy.notificationsHintSettings;
  return {
    alertsOn,
    onPress,
    // Pixel cells grow with Dynamic Type up to 2x, snapped to whole pixels.
    cell: PixelRatio.roundToNearestPixel(BASE_CELL * Math.min(fontScale, 2)),
    compact: fontScale <= INFO_NOTIFICATIONS_COMPACT_MAX_FONT_SCALE,
    a11y: {
      accessibilityRole: 'button' as const,
      accessibilityLabel: infoCopy.notificationsA11y,
      accessibilityValue: { text: alertsOn ? infoCopy.notificationsOn : infoCopy.notificationsOff },
      accessibilityHint: hint,
    },
  };
}

function Bell({ on, cell }: { on: boolean; cell: number }) {
  return <PixelArt rows={on ? BELL_ON : BELL_OFF} palette={on ? BELL_ON_PALETTE : BELL_OFF_PALETTE} cell={cell} />;
}

function Value({ on }: { on: boolean }) {
  return (
    <Text style={[styles.value, on && styles.valueOn]} allowFontScaling>
      {on ? infoCopy.notificationsOn : infoCopy.notificationsOff}
    </Text>
  );
}

/** Option A: bell + On/Off readout for the Info header, like a game HUD. */
export function NotificationsHud() {
  const { alertsOn, onPress, cell, a11y } = useNotificationsControl();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.hud, pressed && styles.pressed]} {...a11y}>
      <Bell on={alertsOn} cell={cell} />
      <Value on={alertsOn} />
    </Pressable>
  );
}

function Leaders() {
  const [count, setCount] = useState(0);
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setCount(Math.max(0, Math.floor(event.nativeEvent.layout.width / LEADER_STEP)));
  }, []);
  return (
    <View style={styles.leaders} onLayout={handleLayout} pointerEvents="none">
      {Array.from({ length: count }, (_, i) => <View key={i} style={styles.leaderDot} />)}
    </View>
  );
}

/** Option E: a game options-menu line ("Notifications ····· On >"). */
export function NotificationsMenuLine() {
  const { alertsOn, onPress, cell, compact, a11y } = useNotificationsControl();
  const label = <Text style={styles.label} allowFontScaling>{infoCopy.notificationsLabel}</Text>;
  const readout = (
    <View style={styles.readout}>
      {compact ? null : <Bell on={alertsOn} cell={cell} />}
      <Value on={alertsOn} />
      <PixelArt rows={CHEVRON} palette={CHEVRON_PALETTE} cell={cell} />
    </View>
  );
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.line, pressed && styles.pressed]} {...a11y}>
      {compact ? (
        <View style={styles.lineRow}>
          <Bell on={alertsOn} cell={cell} />
          {label}
          <Leaders />
          {readout}
        </View>
      ) : (
        <>
          {label}
          {readout}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hud: {
    minHeight: theme.a11y.minTapTarget,
    minWidth: theme.a11y.minTapTarget,
    paddingHorizontal: theme.space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
  },
  pressed: { transform: [{ translateY: PRESSED_SHIFT }] },
  value: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: VALUE_FONT_SIZE,
    lineHeight: VALUE_FONT_SIZE + 5,
    color: theme.colors.textSecondary,
  },
  valueOn: { color: theme.colors.successGreen },
  line: {
    marginHorizontal: theme.space.lg,
    marginTop: theme.space.lg,
    minHeight: theme.a11y.minTapTarget,
    justifyContent: 'center',
  },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: theme.space.sm },
  label: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: VALUE_FONT_SIZE,
    lineHeight: VALUE_FONT_SIZE + 7,
    color: theme.colors.textPrimary,
  },
  leaders: {
    flex: 1,
    minWidth: theme.space.lg,
    height: LEADER_DOT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    overflow: 'hidden',
    opacity: LEADER_OPACITY,
  },
  leaderDot: { width: LEADER_DOT, height: LEADER_DOT, backgroundColor: theme.colors.textSecondary },
  readout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: theme.space.sm },
});
