import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { ProgressDots } from './ProgressDots';
import { TOTAL_STEPS } from '../types';
import { onboardCopy } from '../../../copy/onboard';
import { theme } from '../../../design/tokens';
import { bevelAmberRaised, glowDividerLine } from '../../../design/bevel';
import { fillSelf, fixedFillSelf } from '../../../design/layout';
import { SparkleDecoration } from '../../../core/fx';
import { PulseRing } from '../../../core/ui/PulseRing';
import { StarFieldBg } from '../../../core/starbg';

const CTA_PULSE_CYCLE_MS = 2400;
const CTA_PULSE_OUTER_DELAY_MS = 500;

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
 * Star field background, header with neon bar, scrollable body,
 * amber beveled CTA + optional SKIP pinned to the bottom.
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
      <StarFieldBg seed={`onboard-${stepIndex}`} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header" allowFontScaling>
          {title}
        </Text>
        <ProgressDots total={TOTAL_STEPS} current={stepIndex} />
      </View>

      {/* Glow divider under header */}
      <View style={styles.glowDivider} />

      {/* Scrollable body */}
      <ScrollView contentContainerStyle={styles.body}>
        {children}
      </ScrollView>

      {/* Actions */}
      <View style={styles.glowDivider} />
      <View style={styles.actions}>
        <View style={styles.ctaWrap}>
          <PulseRing
            inset={5}
            borderWidth={1.5}
            baseOpacity={0.36}
            delayMs={0}
            color={theme.colors.rewardYellow}
            cycleMs={CTA_PULSE_CYCLE_MS}
          />
          <PulseRing
            inset={10}
            borderWidth={1}
            baseOpacity={0.22}
            delayMs={CTA_PULSE_OUTER_DELAY_MS}
            color={theme.colors.rewardYellow}
            cycleMs={CTA_PULSE_CYCLE_MS}
          />
          <Pressable
            style={styles.nextButton}
            onPress={onNext}
            accessibilityRole="button"
            accessibilityLabel={nextLabel}
          >
            <Text style={styles.nextLabel} allowFontScaling>{nextLabel}</Text>
          </Pressable>
          <SparkleDecoration />
        </View>

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
  // Matches StarFieldBg's own bgVoid fallback so safe-area edges never flash white.
  container: { flex: 1, backgroundColor: theme.colors.bgVoid },
  header: {
    padding: theme.space.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...theme.type.displayS,
    color: theme.colors.textPrimary,
    letterSpacing: 2,
    flex: 1,
    marginRight: theme.space.md,
  },
  glowDivider: { ...glowDividerLine },
  body: { flexGrow: 1, padding: theme.space['2xl'], justifyContent: 'center' },
  actions: {
    padding: theme.space.lg,
    gap: 10,
  },
  ctaWrap: { ...fillSelf, overflow: 'visible' },
  nextButton: {
    ...fixedFillSelf,
    ...bevelAmberRaised,
    backgroundColor: theme.colors.rewardYellow,
    borderRadius: theme.radii.button,
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.space.md,
  },
  nextLabel: {
    ...theme.type.uiLabel,
    fontSize: 15,
    color: theme.colors.bgVoid,
    letterSpacing: 2,
  },
  skipButton: {
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipLabel: { ...theme.type.bodyS, color: theme.colors.textSecondary },
});
