/**
 * Onboarding screen catalog sections. DEV ONLY.
 */
import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { CatalogSection } from '../CatalogSection';
import { WelcomeScreen } from '../../Onboarding/screens/WelcomeScreen';
import { PermissionsScreen } from '../../Onboarding/screens/PermissionsScreen';
import { HowToScreen } from '../../Onboarding/screens/HowToScreen';

const noop = () => {};

export const OnboardWelcome = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Onboarding — Welcome">
    <View style={{ height: 600 }}>
      <WelcomeScreen stepIndex={0} onNext={noop} />
    </View>
  </CatalogSection>
));
OnboardWelcome.displayName = 'OnboardWelcome';

export const OnboardPermissions = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Onboarding — Permissions">
    <View style={{ height: 600 }}>
      <PermissionsScreen stepIndex={2} onNext={noop} />
    </View>
  </CatalogSection>
));
OnboardPermissions.displayName = 'OnboardPermissions';

export const OnboardHowTo = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Onboarding — How To">
    <View style={{ height: 600 }}>
      <HowToScreen stepIndex={1} onNext={noop} />
    </View>
  </CatalogSection>
));
OnboardHowTo.displayName = 'OnboardHowTo';
