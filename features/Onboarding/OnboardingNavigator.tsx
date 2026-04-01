import React, { useState, useRef } from 'react';
import { PanResponder, View, StyleSheet } from 'react-native';
import { ONBOARDING_STEPS, type OnboardingStep } from './types';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { PermissionsScreen } from './screens/PermissionsScreen';
import { PrivacyScreen } from './screens/PrivacyScreen';

const SWIPE_THRESHOLD = 50;
const SWIPE_VELOCITY_THRESHOLD = 0.3;

interface OnboardingNavigatorProps {
  onComplete: () => Promise<void>;
}

/**
 * Manages the 3-step onboarding sequence:
 *  1. Welcome + How It Works (combined)
 *  2. Privacy commitments (YOUR DATA — privacy promise before permission request)
 *  3. Permissions (location + notifications on one screen)
 *
 * Supports horizontal swipe gestures (left=advance, right=back)
 * alongside the existing button navigation.
 */
export function OnboardingNavigator({ onComplete }: OnboardingNavigatorProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  function advance() {
    setStepIndex((prev) => {
      if (prev + 1 >= ONBOARDING_STEPS.length) {
        onCompleteRef.current();
        return prev;
      }
      return prev + 1;
    });
  }

  function goBack() {
    setStepIndex((prev) => Math.max(0, prev - 1));
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10,
      onPanResponderRelease: (_evt, { dx, vx }) => {
        if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(vx) < SWIPE_VELOCITY_THRESHOLD) return;
        if (dx < 0) advance();
        else goBack();
      },
    }),
  ).current;

  const currentStep: OnboardingStep = ONBOARDING_STEPS[stepIndex];

  const screen = (() => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeScreen stepIndex={stepIndex} onNext={advance} />;
      case 'privacy':
        return <PrivacyScreen stepIndex={stepIndex} onNext={advance} />;
      case 'permissions':
        return <PermissionsScreen stepIndex={stepIndex} onNext={advance} />;
    }
  })();

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {screen}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
