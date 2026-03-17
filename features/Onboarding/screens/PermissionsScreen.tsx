import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { theme } from '../../../design/tokens';

interface PermissionsScreenProps {
  onNext: () => void;
}

/**
 * Screen 2 — Combined location + notification permissions.
 * Two stacked permission cards, each with its own Allow button.
 * Tapping Allow fires the OS dialog — grant or deny, we advance.
 * "SKIP" at the bottom advances without requesting either.
 */
export function PermissionsScreen({ onNext }: PermissionsScreenProps) {
  const [locGranted, setLocGranted] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [requesting, setRequesting] = useState(false);

  async function handleLocation() {
    if (requesting) return;
    setRequesting(true);
    try {
      await Location.requestForegroundPermissionsAsync();
      setLocGranted(true);
    } finally {
      setRequesting(false);
    }
  }

  async function handleNotifications() {
    if (requesting) return;
    setRequesting(true);
    try {
      await Notifications.requestPermissionsAsync();
      setNotifGranted(true);
    } finally {
      setRequesting(false);
    }
  }

  const allDone = locGranted && notifGranted;

  return (
    <OnboardingSlide
      stepIndex={1}
      title={onboardCopy.permissionsTitle}
      nextLabel={allDone ? onboardCopy.done : onboardCopy.next}
      onNext={onNext}
      onSkip={onNext}
    >
      <View style={styles.cards}>
        {/* Location card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle} allowFontScaling>{onboardCopy.locTitle}</Text>
          <Text style={styles.cardWhy} allowFontScaling>{onboardCopy.locWhy}</Text>
          <View style={styles.promiseBox}>
            <Text style={styles.promiseLabel} allowFontScaling>{onboardCopy.ourPromise}</Text>
            <Text style={styles.promise} allowFontScaling>{onboardCopy.locPromise}</Text>
          </View>
          <Pressable
            style={[styles.allowButton, locGranted && styles.allowDone]}
            onPress={locGranted ? undefined : handleLocation}
            disabled={locGranted || requesting}
            accessibilityRole="button"
            accessibilityLabel={locGranted ? onboardCopy.done : onboardCopy.locBtn}
            accessibilityState={{ disabled: locGranted || requesting }}
          >
            <Text style={styles.allowLabel} allowFontScaling>
              {locGranted ? onboardCopy.done : onboardCopy.locBtn}
            </Text>
          </Pressable>
        </View>

        {/* Notifications card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle} allowFontScaling>{onboardCopy.notifTitle}</Text>
          <Text style={styles.cardWhy} allowFontScaling>{onboardCopy.notifWhy}</Text>
          <View style={styles.promiseBox}>
            <Text style={styles.promiseLabel} allowFontScaling>{onboardCopy.ourPromise}</Text>
            <Text style={styles.promise} allowFontScaling>{onboardCopy.notifPromise}</Text>
          </View>
          <Pressable
            style={[styles.allowButton, notifGranted && styles.allowDone]}
            onPress={notifGranted ? undefined : handleNotifications}
            disabled={notifGranted || requesting}
            accessibilityRole="button"
            accessibilityLabel={notifGranted ? onboardCopy.done : onboardCopy.notifBtn}
            accessibilityState={{ disabled: notifGranted || requesting }}
          >
            <Text style={styles.allowLabel} allowFontScaling>
              {notifGranted ? onboardCopy.done : onboardCopy.notifBtn}
            </Text>
          </Pressable>
        </View>
      </View>
    </OnboardingSlide>
  );
}

const styles = StyleSheet.create({
  cards:        { gap: theme.space.xl },
  card:         { borderWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue, padding: theme.space.lg, backgroundColor: theme.colors.surface1 },
  cardTitle:    { ...theme.type.displayS, fontSize: 13, color: theme.colors.rewardYellow, letterSpacing: 2, marginBottom: theme.space.sm },
  cardWhy:      { ...theme.type.bodyS, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: theme.space.md },
  promiseBox:   { borderWidth: theme.borders.standard.width, borderColor: theme.colors.surface2, padding: theme.space.md, marginBottom: theme.space.lg },
  promiseLabel: { ...theme.type.caption, fontWeight: 'bold', color: theme.colors.rewardYellow, letterSpacing: 2, marginBottom: theme.space.xs },
  promise:      { ...theme.type.bodyS, color: theme.colors.textSecondary, lineHeight: 18 },
  allowButton:  { backgroundColor: theme.colors.dangerRed, borderWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, minHeight: theme.a11y.minTapTarget, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.space.sm },
  allowDone:    { backgroundColor: theme.colors.successGreen },
  allowLabel:   { ...theme.type.uiLabel, fontSize: 13, color: theme.colors.textPrimary, letterSpacing: 2 },
});
