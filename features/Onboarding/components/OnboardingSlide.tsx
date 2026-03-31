import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { ProgressDots } from './ProgressDots';
import { TOTAL_STEPS } from '../types';
import { onboardCopy } from '../../../copy/onboard';
import { theme } from '../../../design/tokens';
import { bevelAmberRaised } from '../../../design/bevel';
import { SparkleDecoration } from '../../../core/fx';

interface OnboardingSlideProps {
  stepIndex: number;
  title: string;
  children: React.ReactNode;
  nextLabel?: string;
  onNext: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}

/** Sparse star field dots — absolute-positioned white specks. */
const STARS = [
  { top: 28, left: 12, size: 1, opacity: 0.3 },
  { top: 60, left: 280, size: 2, opacity: 0.25 },
  { top: 110, left: 45, size: 1, opacity: 0.45 },
  { top: 180, left: 310, size: 2, opacity: 0.2 },
  { top: 250, left: 90, size: 1, opacity: 0.35 },
  { top: 320, left: 250, size: 2, opacity: 0.4 },
  { top: 400, left: 170, size: 1, opacity: 0.3 },
  { top: 480, left: 30, size: 2, opacity: 0.25 },
  { top: 520, left: 330, size: 1, opacity: 0.5 },
  { top: 600, left: 120, size: 2, opacity: 0.2 },
  { top: 660, left: 290, size: 1, opacity: 0.35 },
  { top: 720, left: 60, size: 2, opacity: 0.4 },
] as const;

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
      {/* Star field */}
      {STARS.map((star, i) => (
        <View
          key={i}
          style={[
            styles.star,
            {
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
            },
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
      ))}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header" allowFontScaling>
          {title}
        </Text>
        <ProgressDots total={TOTAL_STEPS} current={stepIndex} />
      </View>

      {/* Neon bar under header — 3-segment fade approximation */}
      <View style={styles.neonBarRow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.neonEdge} />
        <View style={styles.neonCenter} />
        <View style={styles.neonEdge} />
      </View>

      {/* Scrollable body */}
      <ScrollView contentContainerStyle={styles.body}>
        {children}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.ctaWrap}>
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
  container: { flex: 1, backgroundColor: theme.colors.bgVoid },
  star: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
    pointerEvents: 'none',
  },
  header: {
    backgroundColor: theme.colors.bgNav,
    padding: theme.space.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: theme.borders.hero.width,
    borderColor: theme.colors.frameBlue,
  },
  title: {
    ...theme.type.displayS,
    color: theme.colors.textPrimary,
    letterSpacing: 2,
    flex: 1,
    marginRight: theme.space.md,
  },
  neonBarRow: { flexDirection: 'row', height: 2 },
  neonEdge: { flex: 1, backgroundColor: theme.colors.focusAccent, opacity: 0.3 },
  neonCenter: { flex: 2, backgroundColor: theme.colors.highlightBlue },
  body: { flexGrow: 1, padding: theme.space['2xl'] },
  actions: {
    padding: theme.space.lg,
    gap: 10,
    borderTopWidth: theme.borders.standard.width,
    borderColor: theme.colors.frameBlue,
  },
  ctaWrap: { overflow: 'visible' },
  nextButton: {
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
