import React, { useState, useCallback } from 'react';
import { ONBOARDING_STEPS, type OnboardingStep } from './types';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { PermissionsScreen } from './screens/PermissionsScreen';
import { PrivacyScreen } from './screens/PrivacyScreen';

interface OnboardingNavigatorProps {
  onComplete: () => Promise<void>;
}

/**
 * Manages the 3-step onboarding sequence:
 *  1. Welcome + How It Works (combined)
 *  2. Permissions (location + notifications on one screen)
 *  3. Privacy commitments (tightened)
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

    case 'permissions':
      return <PermissionsScreen onNext={advance} />;

    case 'privacy':
      return <PrivacyScreen onNext={advance} />;
  }
}
