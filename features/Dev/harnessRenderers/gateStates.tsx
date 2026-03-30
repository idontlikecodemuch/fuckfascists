/**
 * Harness renderers for gate screens: Launch + Onboarding.
 * DEV ONLY — never imported outside features/Dev/.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LaunchScreen } from '../../Launch/LaunchScreen';
import { WelcomeScreen } from '../../Onboarding/screens/WelcomeScreen';
import { PrivacyScreen } from '../../Onboarding/screens/PrivacyScreen';
import { PermissionsScreen } from '../../Onboarding/screens/PermissionsScreen';
import { theme } from '../../../design/tokens';

const noop = () => {};

/**
 * Wrap LaunchScreen so auto-dismiss timer doesn't fire during capture.
 * We just render it as a static snapshot.
 */
export function renderLaunchDefault(): React.ReactElement {
  return (
    <View style={styles.fullScreen}>
      <LaunchScreen onDismiss={noop} />
    </View>
  );
}

export function renderOnboardWelcome(): React.ReactElement {
  return (
    <View style={styles.fullScreen}>
      <WelcomeScreen onNext={noop} />
    </View>
  );
}

export function renderOnboardPrivacy(): React.ReactElement {
  return (
    <View style={styles.fullScreen}>
      <PrivacyScreen onNext={noop} />
    </View>
  );
}

export function renderOnboardPermsPreGrant(): React.ReactElement {
  return (
    <View style={styles.fullScreen}>
      <PermissionsScreen onNext={noop} />
    </View>
  );
}

/**
 * PermissionsScreen with both permissions already granted.
 * Uses a thin wrapper that pre-sets granted state.
 */
function PermissionsScreenGranted() {
  // The PermissionsScreen uses internal useState for locGranted/notifGranted.
  // We can't set those from outside, so we render the screen's confirmed UI
  // by patching the permission handlers. Instead, we render a wrapper component
  // that reproduces the confirmed state using the same OnboardingSlide + cards.
  // For simplicity, we render the screen and note it shows pre-grant.
  // To show the granted state, we need a controllable wrapper.
  return <PermissionsGrantedMock />;
}

/**
 * Minimal reproduction of PermissionsScreen with both permissions shown as GRANTED.
 * Reproduces the card layout from PermissionsScreen without calling real permission APIs.
 */
import { Text, Pressable } from 'react-native';
import { OnboardingSlide } from '../../Onboarding/components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';

function PermissionsGrantedMock() {
  return (
    <OnboardingSlide
      stepIndex={2}
      title={onboardCopy.permissionsTitle}
      nextLabel={onboardCopy.next}
      onNext={noop}
      onSkip={noop}
    >
      <View style={grantedStyles.cards}>
        <View style={[grantedStyles.card, grantedStyles.cardDone]}>
          <Text style={grantedStyles.cardTitle} allowFontScaling>{onboardCopy.locTitle}</Text>
          <Text style={grantedStyles.cardWhy} allowFontScaling>{onboardCopy.locWhy}</Text>
          <Text style={grantedStyles.promise} allowFontScaling>{onboardCopy.locPromise}</Text>
          <Text style={grantedStyles.confirmedLabel} allowFontScaling>{onboardCopy.confirmed}</Text>
        </View>
        <View style={[grantedStyles.card, grantedStyles.cardDone]}>
          <Text style={grantedStyles.cardTitle} allowFontScaling>{onboardCopy.notifTitle}</Text>
          <Text style={grantedStyles.cardWhy} allowFontScaling>{onboardCopy.notifWhy}</Text>
          <Text style={grantedStyles.promise} allowFontScaling>{onboardCopy.notifPromise}</Text>
          <Text style={grantedStyles.confirmedLabel} allowFontScaling>{onboardCopy.confirmed}</Text>
        </View>
      </View>
    </OnboardingSlide>
  );
}

export function renderOnboardPermsGranted(): React.ReactElement {
  return (
    <View style={styles.fullScreen}>
      <PermissionsScreenGranted />
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: { flex: 1, backgroundColor: theme.colors.bgVoid },
});

const grantedStyles = StyleSheet.create({
  cards: { gap: theme.space.xl },
  card: {
    borderWidth: theme.borders.hero.width,
    borderColor: theme.colors.frameBlue,
    padding: theme.space.lg,
    backgroundColor: theme.colors.surface1,
  },
  cardDone: { borderColor: theme.colors.successGreen },
  cardTitle: {
    ...theme.type.displayS,
    fontSize: 13,
    color: theme.colors.rewardYellow,
    letterSpacing: 2,
    marginBottom: theme.space.sm,
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
  confirmedLabel: {
    ...theme.type.uiLabel,
    fontSize: 13,
    color: theme.colors.successGreen,
    letterSpacing: 2,
    textAlign: 'center',
    paddingVertical: theme.space.sm,
  },
});
