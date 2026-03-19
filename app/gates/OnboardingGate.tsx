import React from 'react';
import { useOnboarding } from '../../features/Onboarding/hooks/useOnboarding';
import { OnboardingNavigator } from '../../features/Onboarding/OnboardingNavigator';

interface OnboardingGateProps {
  children: React.ReactNode;
}

/**
 * Shows the onboarding flow if the user hasn't completed it.
 * Returns null while the completion status is loading (parent splash covers this).
 */
export function OnboardingGate({ children }: OnboardingGateProps) {
  const { isComplete, markComplete } = useOnboarding();

  if (isComplete === null) return null;
  if (!isComplete) return <OnboardingNavigator onComplete={markComplete} />;

  return <>{children}</>;
}
