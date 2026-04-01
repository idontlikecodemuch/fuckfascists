import React, { useState, useCallback, useRef } from 'react';
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
  const stepRef = useRef(stepIndex);
  stepRef.current = stepIndex;

  const advance = useCallback(() => {
    const next = stepRef.current + 1;
    if (next >= ONBOARDING_STEPS.length) {
      onComplete();
    } else {
      setStepIndex(next);
    }
  }, [onComplete]);

  const goBack = useCallback(() => {
    if (stepRef.current > 0) {
      setStepIndex(stepRef.current - 1);
    }
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const { dx, vx } = gestureState;
        const isSwipe = Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > SWIPE_VELOCITY_THRESHOLD;
        if (!isSwipe) return;

        if (dx < 0) {
          // Swipe left → advance
          advance();
        } else {
          // Swipe right → go back
          goBack();
        }
      },
    }),
  ).current;

  const currentStep: OnboardingStep = ONBOARDING_STEPS[stepIndex];

  const renderScreen = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeScreen stepIndex={stepIndex} onNext={advance} />;
      case 'privacy':
        return <PrivacyScreen stepIndex={stepIndex} onNext={advance} />;
      case 'permissions':
        return <PermissionsScreen stepIndex={stepIndex} onNext={advance} />;
    }
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {renderScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
