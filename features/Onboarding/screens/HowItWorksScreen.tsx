import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';

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
    icon: onboardCopy.surveyIcon,
    title: onboardCopy.surveyTitle,
    desc:  onboardCopy.surveyDesc,
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

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const RED   = '#CC0000';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  list:      { gap: 16 },
  card:      { flexDirection: 'row', borderWidth: 3, borderColor: BLACK, padding: 14, backgroundColor: WHITE, gap: 14 },
  icon:      { fontFamily: MONO, fontSize: 15, fontWeight: 'bold', color: RED, width: 36, textAlign: 'center', lineHeight: 20, paddingTop: 2 },
  cardBody:  { flex: 1 },
  cardTitle: { fontFamily: MONO, fontSize: 13, fontWeight: 'bold', color: RED, letterSpacing: 2, marginBottom: 6 },
  cardDesc:  { fontFamily: MONO, fontSize: 12, color: '#333', lineHeight: 18 },
});
