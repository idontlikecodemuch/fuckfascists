import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';

interface WelcomeScreenProps {
  onNext: () => void;
}

export function WelcomeScreen({ onNext }: WelcomeScreenProps) {
  return (
    <OnboardingSlide stepIndex={0} title="WELCOME" nextLabel="LET'S GO" onNext={onNext}>
      <View style={styles.content}>
        <Text style={styles.appName} allowFontScaling={false}>F*CK{'\n'}FASCISTS</Text>

        <Text style={styles.tagline} allowFontScaling>
          Your money.{'\n'}Your power.{'\n'}Your choice.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.body} allowFontScaling>
          Every dollar you spend is a vote. This app helps you avoid businesses
          and platforms that fund Republican campaigns and authoritarian politics
          — and celebrate the times you do.
        </Text>

        <Text style={styles.note} allowFontScaling>
          Open-source · Nonprofit · Privacy-first
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
