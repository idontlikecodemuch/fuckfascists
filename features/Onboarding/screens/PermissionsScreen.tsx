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
 * Screen 3 — Combined location + notification permissions.
 * Two stacked permission cards, each with its own Allow button.
 * Tapping Allow fires the OS dialog — grant or deny, we advance.
 * When granted, card shows a confirmed state (green, "GRANTED" label).
 * Single bottom CTA only — no per-card "LET'S GO" buttons.
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
      stepIndex={2}
      title={onboardCopy.permissionsTitle}
      nextLabel={allDone ? onboardCopy.done : onboardCopy.next}
      onNext={onNext}
      onSkip={onNext}
    >
      <View style={styles.cards}>
        {/* Location card */}
        <View style={[styles.card, locGranted && styles.cardDone]}>
          <Text style={styles.cardTitle} allowFontScaling>{onboardCopy.locTitle}</Text>
          <Text style={styles.cardWhy} allowFontScaling>{onboardCopy.locWhy}</Text>
          <View style={styles.promiseBox}>
            <Text style={styles.promiseLabel} allowFontScaling>{onboardCopy.ourPromise}</Text>
            <Text style={styles.promise} allowFontScaling>{onboardCopy.locPromise}</Text>
          </View>
          {locGranted ? (
            <Text style={styles.confirmedLabel} allowFontScaling>{onboardCopy.confirmed}</Text>
          ) : (
            <Pressable
              style={styles.allowButton}
              onPress={handleLocation}
              disabled={requesting}
              accessibilityRole="button"
              accessibilityLabel={onboardCopy.locBtn}
              accessibilityState={{ disabled: requesting }}
            >
              <Text style={styles.allowLabel} allowFontScaling>
                {onboardCopy.locBtn}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Notifications card */}
        <View style={[styles.card, notifGranted && styles.cardDone]}>
          <Text style={styles.cardTitle} allowFontScaling>{onboardCopy.notifTitle}</Text>
          <Text style={styles.cardWhy} allowFontScaling>{onboardCopy.notifWhy}</Text>
          <View style={styles.promiseBox}>
            <Text style={styles.promiseLabel} allowFontScaling>{onboardCopy.ourPromise}</Text>
            <Text style={styles.promise} allowFontScaling>{onboardCopy.notifPromise}</Text>
          </View>
          {notifGranted ? (
            <Text style={styles.confirmedLabel} allowFontScaling>{onboardCopy.confirmed}</Text>
          ) : (
            <Pressable
              style={styles.allowButton}
              onPress={handleNotifications}
              disabled={requesting}
              accessibilityRole="button"
              accessibilityLabel={onboardCopy.notifBtn}
              accessibilityState={{ disabled: requesting }}
            >
              <Text style={styles.allowLabel} allowFontScaling>
                {onboardCopy.notifBtn}
              </Text>
            </Pressable>
          )}
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
  cardDone:       { borderColor: theme.colors.successGreen },
  allowButton:    { backgroundColor: theme.colors.dangerRed, borderWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, minHeight: theme.a11y.minTapTarget, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.space.sm },
  allowLabel:     { ...theme.type.uiLabel, fontSize: 13, color: theme.colors.textPrimary, letterSpacing: 2 },
  confirmedLabel: { ...theme.type.uiLabel, fontSize: 13, color: theme.colors.successGreen, letterSpacing: 2, textAlign: 'center', paddingVertical: theme.space.sm },
});
