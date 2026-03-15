import React, { useState, useCallback } from 'react';
import * as ExpoLocation from 'expo-location';
import * as Notifications from 'expo-notifications';
import { ONBOARDING_STEPS, type OnboardingStep } from './types';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { HowItWorksScreen } from './screens/HowItWorksScreen';
import { PrivacyScreen } from './screens/PrivacyScreen';
import { PermissionScreen } from './screens/PermissionScreen';
import { onboardCopy } from '../../copy/onboard';

interface OnboardingNavigatorProps {
  onComplete: () => Promise<void>;
}

/**
 * Manages the onboarding step sequence.
 * Stateless with respect to persistence — the parent passes `onComplete`
 * which writes the SecureStore flag (via useOnboarding.markComplete).
 */
export function OnboardingNavigator({ onComplete }: OnboardingNavigatorProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const advance = useCallback(() => {
    const next = stepIndex + 1;
    if (next >= ONBOARDING_STEPS.length) {
      onComplete();
    } else {
      setStepIndex(next);
    }
  }, [stepIndex, onComplete]);

  const currentStep: OnboardingStep = ONBOARDING_STEPS[stepIndex];

  switch (currentStep) {
    case 'welcome':
      return <WelcomeScreen onNext={advance} />;

    case 'how-it-works':
      return <HowItWorksScreen onNext={advance} />;

    case 'privacy':
      return <PrivacyScreen onNext={advance} />;

    case 'location':
      return (
        <PermissionScreen
          stepIndex={3}
          title={onboardCopy.locTitle}
          icon={onboardCopy.locIcon}
          why={onboardCopy.locWhy}
          promise={onboardCopy.locPromise}
          allowLabel={onboardCopy.locBtn}
          onAllow={async () => {
            await ExpoLocation.requestForegroundPermissionsAsync();
            advance();
          }}
          onSkip={advance}
        />
      );

    case 'notifications':
      return (
        <PermissionScreen
          stepIndex={4}
          title={onboardCopy.notifTitle}
          icon={onboardCopy.notifIcon}
          why={onboardCopy.notifWhy}
          promise={onboardCopy.notifPromise}
          allowLabel={onboardCopy.notifBtn}
          onAllow={async () => {
            await Notifications.requestPermissionsAsync();
            advance();
          }}
          onSkip={advance}
        />
      );
  }
}
