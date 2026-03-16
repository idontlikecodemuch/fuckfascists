import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { theme } from '../../../design/tokens';

interface WelcomeScreenProps {
  onNext: () => void;
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <OnboardingSlide stepIndex={0} title={onboardCopy.welcomeTitle} nextLabel={onboardCopy.letsGo} onNext={onNext}>
      <View style={styles.content}>
        <Text style={styles.appName} allowFontScaling={false}>{onboardCopy.appDisplay}</Text>

        <Text style={styles.tagline} allowFontScaling>
          {onboardCopy.tagline}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.body} allowFontScaling>
          {onboardCopy.body}
        </Text>

        <Text style={styles.note} allowFontScaling>
          {onboardCopy.note}
        </Text>
      </View>
    </OnboardingSlide>
  );
}

const styles = StyleSheet.create({
  content:  { alignItems: 'flex-start' },
  appName:  { fontFamily: theme.fonts.headline, fontSize: 48, color: theme.colors.dangerRed, lineHeight: 52, marginBottom: theme.space.xl },
  tagline:  { ...theme.type.displayS, color: theme.colors.textPrimary, lineHeight: 28, marginBottom: theme.space['2xl'] },
  divider:  { width: 48, height: 4, backgroundColor: theme.colors.dangerRed, marginBottom: theme.space['2xl'] },
  body:     { ...theme.type.bodyM, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: theme.space['2xl'] },
  note:     { ...theme.type.caption, color: theme.colors.textSecondary, letterSpacing: 1 },
});
