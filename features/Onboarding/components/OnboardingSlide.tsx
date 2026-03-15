import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { ProgressDots } from './ProgressDots';
import { TOTAL_STEPS } from '../types';
import { onboardCopy } from '../../../copy/onboard';

interface OnboardingSlideProps {
  stepIndex: number;
  title: string;
  children: React.ReactNode;
  nextLabel?: string;
  onNext: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}

/**
 * Shared layout for all onboarding screens.
 * Pixel art shell: black top bar with title + progress dots, scrollable body,
 * action buttons pinned to the bottom.
 */
export function OnboardingSlide({
  stepIndex,
  title,
  children,
  nextLabel = onboardCopy.next,
  onNext,
  onSkip,
  skipLabel = onboardCopy.skip,
}: OnboardingSlideProps) {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header" allowFontScaling>
          {title}
        </Text>
        <ProgressDots total={TOTAL_STEPS} current={stepIndex} />
      </View>

      {/* Scrollable body */}
      <ScrollView contentContainerStyle={styles.body}>
        {children}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.nextButton}
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
        >
          <Text style={styles.nextLabel} allowFontScaling>{nextLabel}</Text>
        </Pressable>

        {onSkip && (
          <Pressable
            style={styles.skipButton}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={skipLabel}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.skipLabel} allowFontScaling>{skipLabel}</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const RED   = '#CC0000';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: WHITE },
  header:     { backgroundColor: BLACK, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 4, borderColor: RED },
  title:      { fontFamily: MONO, fontSize: 16, fontWeight: 'bold', color: WHITE, letterSpacing: 2, flex: 1, marginRight: 12 },
  body:       { flexGrow: 1, padding: 24 },
  actions:    { padding: 16, gap: 10, borderTopWidth: 2, borderColor: BLACK },
  nextButton: { backgroundColor: RED, borderWidth: 3, borderColor: BLACK, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  nextLabel:  { fontFamily: MONO, fontSize: 15, fontWeight: 'bold', color: WHITE, letterSpacing: 2 },
  skipButton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  skipLabel:  { fontFamily: MONO, fontSize: 12, color: '#888' },
});
