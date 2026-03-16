import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { ProgressDots } from './ProgressDots';
import { TOTAL_STEPS } from '../types';
import { onboardCopy } from '../../../copy/onboard';
import { theme } from '../../../design/tokens';

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
 * Dark shell: bgNav top bar with title + progress dots, scrollable body,
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

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: theme.colors.bgVoid },
  header:     { backgroundColor: theme.colors.bgNav, padding: theme.space.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue },
  title:      { ...theme.type.displayS, color: theme.colors.textPrimary, letterSpacing: 2, flex: 1, marginRight: theme.space.md },
  body:       { flexGrow: 1, padding: theme.space['2xl'] },
  actions:    { padding: theme.space.lg, gap: 10, borderTopWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue },
  nextButton: { backgroundColor: theme.colors.dangerRed, borderWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, minHeight: theme.a11y.minTapTarget, alignItems: 'center', justifyContent: 'center', paddingVertical: theme.space.md },
  nextLabel:  { ...theme.type.uiLabel, fontSize: 15, color: theme.colors.textPrimary, letterSpacing: 2 },
  skipButton: { minHeight: theme.a11y.minTapTarget, alignItems: 'center', justifyContent: 'center' },
  skipLabel:  { ...theme.type.bodyS, color: theme.colors.textSecondary },
});
