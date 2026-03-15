import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';

interface PrivacyScreenProps {
  onNext: () => void;
}

const POINTS = [
  { label: onboardCopy.noAccounts,  detail: onboardCopy.noAccountsDesc },
  { label: onboardCopy.noLocation,  detail: onboardCopy.noLocationDesc },
  { label: onboardCopy.noHistory,   detail: onboardCopy.noHistoryDesc },
  { label: onboardCopy.onDevice,    detail: onboardCopy.onDeviceDesc },
  { label: onboardCopy.openSource,  detail: onboardCopy.openSourceDesc },
  { label: onboardCopy.fecData,     detail: onboardCopy.fecDataDesc },
] as const;

export function PrivacyScreen({ onNext }: PrivacyScreenProps) {
  return (
    <OnboardingSlide stepIndex={2} title={onboardCopy.privacyTitle} onNext={onNext}>
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
