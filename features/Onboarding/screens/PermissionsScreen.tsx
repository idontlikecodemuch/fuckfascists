import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { theme } from '../../../design/tokens';
import { bevelRaised, bevelAmberRaised, bevelGreenInset } from '../../../design/bevel';
import { SparkleDecoration } from '../../../core/fx';

const BETA_KEY = 'ff_beta_mode';

interface PermissionsScreenProps {
  stepIndex: number;
  onNext: () => void;
}

/**
 * Screen 3 — Combined location + notification permissions.
 * Grey raised-bevel cards with status indicators.
 * Granted cards get green left accent bar, sparkles, and green title.
 * Amber raised-bevel ALLOW buttons. Green inset-bevel GRANTED label.
 */
export function PermissionsScreen({ stepIndex, onNext }: PermissionsScreenProps) {
  const [locGranted, setLocGranted] = useState(false);
  const [notifGranted, setNotifGranted] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [isBeta, setIsBeta] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkExisting() {
      const beta = await SecureStore.getItemAsync(BETA_KEY);
      if (cancelled) return;
      if (beta === 'true') { setIsBeta(true); return; }

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
    if (isBeta) { setLocGranted(true); return; }
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
    if (isBeta) { setNotifGranted(true); return; }
    setRequesting(true);
    try {
      const { granted } = await Notifications.requestPermissionsAsync();
      if (granted) setNotifGranted(true);
    } finally {
      setRequesting(false);
    }
  }

  useEffect(() => {
    if (isBeta) return;
    if (locGranted && notifGranted) onNext();
  }, [locGranted, notifGranted, onNext, isBeta]);

  const bothGranted = locGranted && notifGranted;

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
        <View style={[styles.card, locGranted && styles.cardGranted]}>
          {locGranted && <View style={styles.greenAccent} />}
          <View style={styles.cardInner}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, locGranted && styles.statusDotOn]} />
              <Text
                style={[styles.statusText, locGranted && styles.statusTextOn]}
                allowFontScaling
              >
                {locGranted ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
            <Text
              style={[styles.cardTitle, locGranted && styles.cardTitleGranted]}
              allowFontScaling
            >
              {onboardCopy.locTitle}
            </Text>
            <Text style={styles.cardWhy} allowFontScaling>{onboardCopy.locWhy}</Text>
            <Text style={styles.promise} allowFontScaling>{onboardCopy.locPromise}</Text>
            {locGranted ? (
              <View style={styles.grantedBadge}>
                <Text style={styles.grantedLabel} allowFontScaling>
                  {onboardCopy.confirmed}
                </Text>
              </View>
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
          {bothGranted && <SparkleDecoration />}
        </View>

        {/* Notifications card */}
        <View style={[styles.card, notifGranted && styles.cardGranted]}>
          {notifGranted && <View style={styles.greenAccent} />}
          <View style={styles.cardInner}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, notifGranted && styles.statusDotOn]} />
              <Text
                style={[styles.statusText, notifGranted && styles.statusTextOn]}
                allowFontScaling
              >
                {notifGranted ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
            <Text
              style={[styles.cardTitle, notifGranted && styles.cardTitleGranted]}
              allowFontScaling
            >
              {onboardCopy.notifTitle}
            </Text>
            <Text style={styles.cardWhy} allowFontScaling>{onboardCopy.notifWhy}</Text>
            <Text style={styles.promise} allowFontScaling>{onboardCopy.notifPromise}</Text>
            {notifGranted ? (
              <View style={styles.grantedBadge}>
                <Text style={styles.grantedLabel} allowFontScaling>
                  {onboardCopy.confirmed}
                </Text>
              </View>
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
          {bothGranted && <SparkleDecoration />}
        </View>

        {bothGranted && (
          <Text style={styles.autoAdvance} allowFontScaling>
            {onboardCopy.next}...
          </Text>
        )}
      </View>
    </OnboardingSlide>
  );
}

const styles = StyleSheet.create({
  cards: { gap: theme.space.xl },
  card: {
    ...bevelRaised,
    backgroundColor: theme.colors.panelInner,
    flexDirection: 'row',
    overflow: 'visible',
  },
  cardGranted: {
    borderLeftColor: theme.colors.successGreenText,
  },
  greenAccent: {
    width: 3,
    backgroundColor: theme.colors.successGreenText,
  },
  cardInner: {
    flex: 1,
    padding: theme.space.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.xs,
    marginBottom: theme.space.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.textSecondary,
  },
  statusDotOn: {
    backgroundColor: theme.colors.successGreenText,
  },
  statusText: {
    ...theme.type.caption,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  statusTextOn: {
    color: theme.colors.successGreenText,
  },
  cardTitle: {
    fontFamily: theme.fonts.headline,
    fontSize: 13,
    color: theme.colors.rewardYellow,
    letterSpacing: 2,
    marginBottom: theme.space.sm,
  },
  cardTitleGranted: {
    color: theme.colors.successGreenText,
  },
  cardWhy: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.space.md,
  },
  promise: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.space.md,
  },
  allowButton: {
    ...bevelAmberRaised,
    backgroundColor: theme.colors.rewardYellow,
    borderRadius: theme.radii.button,
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.space.sm,
  },
  allowLabel: {
    ...theme.type.uiLabel,
    fontSize: 13,
    color: theme.colors.bgVoid,
    letterSpacing: 2,
  },
  grantedBadge: {
    ...bevelGreenInset,
    backgroundColor: theme.colors.successGreenDeep,
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.space.sm,
  },
  grantedLabel: {
    ...theme.type.uiLabel,
    fontSize: 13,
    color: theme.colors.successGreenText,
    letterSpacing: 2,
  },
  autoAdvance: {
    ...theme.type.bodyS,
    color: theme.colors.highlightBlue,
    opacity: 0.6,
    textAlign: 'center',
  },
});
