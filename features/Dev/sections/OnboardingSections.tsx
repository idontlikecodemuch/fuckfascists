/**
 * Onboarding screen catalog sections. DEV ONLY.
 */
import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { CatalogSection } from '../CatalogSection';
import { WelcomeScreen } from '../../Onboarding/screens/WelcomeScreen';
import { HowItWorksScreen } from '../../Onboarding/screens/HowItWorksScreen';
import { PrivacyScreen } from '../../Onboarding/screens/PrivacyScreen';
import { PermissionScreen } from '../../Onboarding/screens/PermissionScreen';
import { onboardCopy } from '../../../copy/onboard';

const noop = () => {};
const noopAsync = async () => {};

export const OnboardWelcome = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Onboarding — Welcome">
    <View style={{ height: 600 }}>
      <WelcomeScreen onNext={noop} />
    </View>
  </CatalogSection>
));
OnboardWelcome.displayName = 'OnboardWelcome';

export const OnboardHowItWorks = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Onboarding — How It Works">
    <View style={{ height: 500 }}>
      <HowItWorksScreen onNext={noop} />
    </View>
  </CatalogSection>
));
OnboardHowItWorks.displayName = 'OnboardHowItWorks';

export const OnboardPrivacy = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Onboarding — Privacy">
    <View style={{ height: 600 }}>
      <PrivacyScreen onNext={noop} />
    </View>
  </CatalogSection>
));
OnboardPrivacy.displayName = 'OnboardPrivacy';

export const OnboardPermissionLocation = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Onboarding — Permission (Location)">
    <View style={{ height: 500 }}>
      <PermissionScreen
        stepIndex={3}
        title={onboardCopy.locTitle}
        icon={onboardCopy.locIcon}
        why={onboardCopy.locWhy}
        promise={onboardCopy.locPromise}
        allowLabel={onboardCopy.locBtn}
        onAllow={noopAsync}
        onSkip={noop}
      />
    </View>
  </CatalogSection>
));
OnboardPermissionLocation.displayName = 'OnboardPermissionLocation';

export const OnboardPermissionNotif = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Onboarding — Permission (Notifications)">
    <View style={{ height: 500 }}>
      <PermissionScreen
        stepIndex={4}
        title={onboardCopy.notifTitle}
        icon={onboardCopy.notifIcon}
        why={onboardCopy.notifWhy}
        promise={onboardCopy.notifPromise}
        allowLabel={onboardCopy.notifBtn}
        onAllow={noopAsync}
        onSkip={noop}
      />
    </View>
  </CatalogSection>
));
OnboardPermissionNotif.displayName = 'OnboardPermissionNotif';
