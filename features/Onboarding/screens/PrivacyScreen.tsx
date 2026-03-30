import React from 'react';
import { View, Text, Linking, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { sharedCopy } from '../../../copy/shared';
import { theme } from '../../../design/tokens';

interface PrivacyScreenProps {
  stepIndex: number;
  onNext: () => void;
}

const POINTS = [
  { label: onboardCopy.noSignIn,       detail: onboardCopy.noSignInDesc },
  { label: onboardCopy.noLocation,     detail: onboardCopy.noLocationDesc },
  { label: onboardCopy.noVisitHistory, detail: onboardCopy.noVisitHistoryDesc },
  { label: onboardCopy.noServers,      detail: onboardCopy.noServersDesc },
] as const;

export function PrivacyScreen({ stepIndex, onNext }: PrivacyScreenProps) {
  return (
    <OnboardingSlide stepIndex={stepIndex} title={onboardCopy.privacyTitle} onNext={onNext}>
      <View style={styles.container}>
        <Text style={styles.subhead} allowFontScaling>
          {onboardCopy.privacySubhead}
        </Text>
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
          {/* Open source — with tappable link to repo */}
          <View style={styles.row}>
            <View style={styles.bullet} accessible={false} />
            <View style={styles.textBlock}>
              <Text style={styles.label} allowFontScaling>{onboardCopy.openSource}</Text>
              <Text style={styles.detail} allowFontScaling>
                {onboardCopy.openSourceDesc}
                <Text
                  style={styles.link}
                  onPress={() => Linking.openURL(sharedCopy.repoUrl)}
                  accessibilityRole="link"
                  accessibilityLabel={onboardCopy.openSourceLink}
                >
                  {onboardCopy.openSourceLink}
                </Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    </OnboardingSlide>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  subhead:   { ...theme.type.bodyS, color: theme.colors.textSecondary, lineHeight: 20, marginBottom: theme.space.xl },
  list:      { gap: theme.space.lg },
  row:       { flexDirection: 'row', gap: theme.space.md, alignItems: 'flex-start' },
  bullet:    { width: 8, height: 8, backgroundColor: theme.colors.dangerRed, marginTop: 5, flexShrink: 0 },
  textBlock: { flex: 1 },
  label:     { ...theme.type.caption, fontWeight: 'bold', color: theme.colors.textPrimary, letterSpacing: 1, marginBottom: 3 },
  detail:    { ...theme.type.bodyS, color: theme.colors.textSecondary, lineHeight: 18 },
  link:      { color: theme.colors.rewardYellow, textDecorationLine: 'underline' as const },
});
