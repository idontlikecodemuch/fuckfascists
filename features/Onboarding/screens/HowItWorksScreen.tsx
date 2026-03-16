import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { theme } from '../../../design/tokens';

interface HowItWorksScreenProps {
  onNext: () => void;
}

const FEATURES = [
  {
    icon: onboardCopy.mapIcon,
    title: onboardCopy.mapTitle,
    desc:  onboardCopy.mapDesc,
  },
  {
    icon: onboardCopy.platformsIcon,
    title: onboardCopy.platformsTitle,
    desc:  onboardCopy.platformsDesc,
  },
  {
    icon: onboardCopy.reportIcon,
    title: onboardCopy.reportTitle,
    desc:  onboardCopy.reportDesc,
  },
] as const;

export function HowItWorksScreen({ onNext }: HowItWorksScreenProps) {
  return (
    <OnboardingSlide stepIndex={1} title={onboardCopy.howTitle} onNext={onNext}>
      <View style={styles.list}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.card}>
            <Text style={styles.icon} accessible={false}>{f.icon}</Text>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle} allowFontScaling>{f.title}</Text>
              <Text style={styles.cardDesc} allowFontScaling>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </OnboardingSlide>
  );
}

const styles = StyleSheet.create({
  list:      { gap: theme.space.lg },
  card:      { flexDirection: 'row', borderWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue, padding: theme.space.md, backgroundColor: theme.colors.surface2, gap: theme.space.md },
  icon:      { ...theme.type.uiLabel, fontSize: 15, color: theme.colors.rewardYellow, width: 36, textAlign: 'center', lineHeight: 20, paddingTop: 2 },
  cardBody:  { flex: 1 },
  cardTitle: { ...theme.type.displayS, fontSize: 13, color: theme.colors.rewardYellow, letterSpacing: 2, marginBottom: 6 },
  cardDesc:  { ...theme.type.bodyS, color: theme.colors.textSecondary, lineHeight: 18 },
});
