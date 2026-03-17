/**
 * Onboarding screen catalog sections. DEV ONLY.
 */
import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { CatalogSection } from '../CatalogSection';
import { WelcomeScreen } from '../../Onboarding/screens/WelcomeScreen';
import { PermissionsScreen } from '../../Onboarding/screens/PermissionsScreen';
import { PrivacyScreen } from '../../Onboarding/screens/PrivacyScreen';

const noop = () => {};

export const OnboardWelcome = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Onboarding — Welcome">
    <View style={{ height: 600 }}>
      <WelcomeScreen onNext={noop} />
    </View>
  </CatalogSection>
));
OnboardWelcome.displayName = 'OnboardWelcome';

export const OnboardPermissions = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Onboarding — Permissions">
    <View style={{ height: 600 }}>
      <PermissionsScreen onNext={noop} />
    </View>
  </CatalogSection>
));
OnboardPermissions.displayName = 'OnboardPermissions';

export const OnboardPrivacy = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Onboarding — Privacy">
    <View style={{ height: 600 }}>
      <PrivacyScreen onNext={noop} />
    </View>
  </CatalogSection>
));
OnboardPrivacy.displayName = 'OnboardPrivacy';
