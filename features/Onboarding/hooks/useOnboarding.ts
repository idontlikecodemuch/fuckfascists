import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';

const ONBOARDING_KEY = 'onboarding_complete';

export interface OnboardingState {
  /** null while loading from SecureStore; true/false once resolved. */
  isComplete: boolean | null;
  markComplete: () => Promise<void>;
}

/**
 * Persists onboarding completion state in SecureStore.
 * Used by the root navigation to decide whether to show the onboarding flow.
 *
 * No personal data is stored — just a boolean flag.
 */
export function useOnboarding(): OnboardingState {
  const [isComplete, setIsComplete] = useState<boolean | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(ONBOARDING_KEY)
      .then((val) => setIsComplete(val === 'true'))
      .catch(() => setIsComplete(false)); // treat read errors as not complete
  }, []);

  const markComplete = useCallback(async () => {
    await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');
    setIsComplete(true);
  }, []);

  return { isComplete, markComplete };
}
