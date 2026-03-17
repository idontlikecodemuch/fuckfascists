import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { theme } from '../../../design/tokens';

interface PrivacyScreenProps {
  onNext: () => void;
}

const POINTS = [
  { label: onboardCopy.noAccounts,  detail: onboardCopy.noAccountsDesc },
  { label: onboardCopy.noLocation,  detail: onboardCopy.noLocationDesc },
  { label: onboardCopy.noHistory,   detail: onboardCopy.noHistoryDesc },
  { label: onboardCopy.onDevice,    detail: onboardCopy.onDeviceDesc },
  { label: onboardCopy.openSource,  detail: onboardCopy.openSourceDesc },
] as const;

export function PrivacyScreen({ onNext }: PrivacyScreenProps) {
  return (
    <OnboardingSlide stepIndex={2} title={onboardCopy.privacyTitle} nextLabel={onboardCopy.done} onNext={onNext}>
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

const styles = StyleSheet.create({
  list:      { gap: theme.space.lg },
  row:       { flexDirection: 'row', gap: theme.space.md, alignItems: 'flex-start' },
  bullet:    { width: 8, height: 8, backgroundColor: theme.colors.dangerRed, marginTop: 5, flexShrink: 0 },
  textBlock: { flex: 1 },
  label:     { ...theme.type.caption, fontWeight: 'bold', color: theme.colors.textPrimary, letterSpacing: 1, marginBottom: 3 },
  detail:    { ...theme.type.bodyS, color: theme.colors.textSecondary, lineHeight: 18 },
});
