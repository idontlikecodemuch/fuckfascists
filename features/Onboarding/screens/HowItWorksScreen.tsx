import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';

interface HowItWorksScreenProps {
  onNext: () => void;
}

const FEATURES = [
  {
    icon: '\u{1F5FA}',  // 🗺
    title: 'MAP',
    desc:  'Scan nearby businesses. Flag GOP donors on your map. Tap AVOIDED and move on.',
  },
  {
    icon: '\u2713',     // ✓
    title: 'WEEKLY SURVEY',
    desc:  'Check off the platforms and services you skipped this week.',
  },
  {
    icon: '\u{1F4CB}', // 📋
    title: 'REPORT CARD',
    desc:  'Every Friday, your weekly impact drops — see it, share it, own it.',
  },
] as const;

export function HowItWorksScreen({ onNext }: HowItWorksScreenProps) {
  return (
    <OnboardingSlide stepIndex={1} title="HOW IT WORKS" onNext={onNext}>
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
  icon:      { fontSize: 28, width: 36, textAlign: 'center' },
  cardBody:  { flex: 1 },
  cardTitle: { fontFamily: MONO, fontSize: 13, fontWeight: 'bold', color: RED, letterSpacing: 2, marginBottom: 6 },
  cardDesc:  { fontFamily: MONO, fontSize: 12, color: '#333', lineHeight: 18 },
});
