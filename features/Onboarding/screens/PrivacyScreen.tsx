import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';

interface PrivacyScreenProps {
  onNext: () => void;
}

const POINTS = [
  { label: 'NO ACCOUNTS',    detail: 'No sign-in, no email, no user ID. Ever.' },
  { label: 'NO LOCATION STORAGE', detail: 'GPS is session-only. Coordinates are never written to disk.' },
  { label: 'NO HISTORY',     detail: 'The app never records which businesses you visited or used — only the ones you actively avoided.' },
  { label: 'ON-DEVICE ONLY', detail: 'All data stays on your phone. No backend, no syncing in v1.' },
  { label: 'OPEN SOURCE',    detail: 'Every line of code is public. Check it yourself.' },
  { label: 'DATA: OPENSECRETS.ORG', detail: 'Donation data comes from the nonpartisan Center for Responsive Politics. Every figure links to its source.' },
] as const;

export function PrivacyScreen({ onNext }: PrivacyScreenProps) {
  return (
    <OnboardingSlide stepIndex={2} title="YOUR PRIVACY FIRST" onNext={onNext}>
      <View style={styles.list}>
        {POINTS.map((p) => (
          <View key={p.label} style={styles.row}>
            <View style={styles.bullet} accessible={false} />
            <View style={styles.textBlock}>
              <Text style={styles.label} allowFontScaling>{p.label}</Text>
              <Text style={styles.detail} allowFontScaling>{p.detail}</Text>
            </View>
          </View>
        ))}
      </View>
    </OnboardingSlide>
  );
}

const BLACK = '#1A1A1A';
const RED   = '#CC0000';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  list:      { gap: 16 },
  row:       { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bullet:    { width: 8, height: 8, backgroundColor: RED, marginTop: 5, flexShrink: 0 },
  textBlock: { flex: 1 },
  label:     { fontFamily: MONO, fontSize: 11, fontWeight: 'bold', color: BLACK, letterSpacing: 1, marginBottom: 3 },
  detail:    { fontFamily: MONO, fontSize: 12, color: '#555', lineHeight: 18 },
});
