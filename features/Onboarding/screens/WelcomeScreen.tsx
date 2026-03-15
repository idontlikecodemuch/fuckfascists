import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';

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

const BLACK = '#1A1A1A';
const RED   = '#CC0000';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  content:  { alignItems: 'flex-start' },
  appName:  { fontFamily: MONO, fontSize: 48, fontWeight: 'bold', color: RED, lineHeight: 52, marginBottom: 20 },
  tagline:  { fontFamily: MONO, fontSize: 18, fontWeight: 'bold', color: BLACK, lineHeight: 28, marginBottom: 24 },
  divider:  { width: 48, height: 4, backgroundColor: RED, marginBottom: 24 },
  body:     { fontFamily: MONO, fontSize: 14, color: '#333', lineHeight: 22, marginBottom: 24 },
  note:     { fontFamily: MONO, fontSize: 11, color: '#888', letterSpacing: 1 },
});
