import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { theme } from '../../../design/tokens';

const BETA_KEY = 'ff_beta_mode';

interface PermissionsScreenProps {
  stepIndex: number;
  onNext: () => void;
}

/**
 * Screen 3 — Combined location + notification permissions.
 * Two stacked permission cards, each with its own Allow button.
 * Tapping Allow fires the OS dialog. Only shows confirmed state if actually granted.
 * When both permissions are granted, auto-advances to next screen.
 * Single bottom CTA only — no per-card buttons.
 * "SKIP" at the bottom advances without requesting either.
 */
export function PermissionsScreen({ stepIndex, onNext }: PermissionsScreenProps) {
  const [locGranted, setLocGranted] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Check if permissions were already granted (e.g. crash mid-onboarding, re-run).
  // Skipped in beta mode so testers can see the full permissions flow.
  useEffect(() => {
    let cancelled = false;
    async function checkExisting() {
      const beta = await SecureStore.getItemAsync(BETA_KEY);
      if (beta === 'true' || cancelled) return;

      const [loc, notif] = await Promise.all([
        Location.getForegroundPermissionsAsync(),
        Notifications.getPermissionsAsync(),
      ]);
      if (cancelled) return;
      if (loc.granted) setLocGranted(true);
      if (notif.granted) setNotifGranted(true);
    }
    checkExisting();
    return () => { cancelled = true; };
  }, []);

  async function handleLocation() {
    if (requesting) return;
    setRequesting(true);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (granted) setLocGranted(true);
    } finally {
      setRequesting(false);
    }
  }

  async function handleNotifications() {
    if (requesting) return;
    setRequesting(true);
    try {
      const { granted } = await Notifications.requestPermissionsAsync();
      if (granted) setNotifGranted(true);
    } finally {
      setRequesting(false);
    }
  }

  // Auto-advance when both permissions are resolved
  useEffect(() => {
    if (locGranted && notifGranted) onNext();
  }, [locGranted, notifGranted, onNext]);

  return (
    <OnboardingSlide
      stepIndex={stepIndex}
      title={onboardCopy.permissionsTitle}
      nextLabel={onboardCopy.next}
      onNext={onNext}
      onSkip={onNext}
    >
      <View style={styles.cards}>
        {/* Location card */}
        <View style={[styles.card, locGranted && styles.cardDone]}>
          <Text style={styles.cardTitle} allowFontScaling>{onboardCopy.locTitle}</Text>
          <Text style={styles.cardWhy} allowFontScaling>{onboardCopy.locWhy}</Text>
          <Text style={styles.promise} allowFontScaling>{onboardCopy.locPromise}</Text>
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
          <Text style={styles.promise} allowFontScaling>{onboardCopy.notifPromise}</Text>
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
  promise:      { ...theme.type.bodyS, color: theme.colors.textSecondary, lineHeight: 18, marginBottom: theme.space.md },
  cardDone:       { borderColor: theme.colors.successGreen },
  allowButton:    { backgroundColor: theme.colors.dangerRed, borderWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, minHeight: theme.a11y.minTapTarget, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.space.sm },
  allowLabel:     { ...theme.type.uiLabel, fontSize: 13, color: theme.colors.textPrimary, letterSpacing: 2 },
  confirmedLabel: { ...theme.type.uiLabel, fontSize: 13, color: theme.colors.successGreen, letterSpacing: 2, textAlign: 'center', paddingVertical: theme.space.sm },
});
