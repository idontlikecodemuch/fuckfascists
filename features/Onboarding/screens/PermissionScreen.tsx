import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { theme } from '../../../design/tokens';

interface PermissionScreenProps {
  stepIndex: number;
  title: string;
  icon: string;
  why: string;
  promise: string;
  allowLabel: string;
  onAllow: () => Promise<void>;
  onSkip: () => void;
}

/**
 * Reusable permission request screen.
 * Used for both Location (step 3) and Notifications (step 4).
 *
 * After the user taps Allow, the OS permission dialog fires.
 * Whether they grant or deny, we advance — the app works either way.
 */
export function PermissionScreen({
  stepIndex,
  title,
  icon,
  why,
  promise,
  allowLabel,
  onAllow,
  onSkip,
}: PermissionScreenProps) {
  const [requesting, setRequesting] = useState(false);

  async function handleAllow() {
    if (requesting) return;
    setRequesting(true);
    try {
      await onAllow();
      // onAllow is responsible for advancing the step
    } finally {
      setRequesting(false);
    }
  }

  return (
    <OnboardingSlide
      stepIndex={stepIndex}
      title={title}
      nextLabel={requesting ? onboardCopy.requesting : allowLabel}
      onNext={handleAllow}
      onSkip={onSkip}
    >
      <View style={styles.content}>
        <Text style={styles.icon} accessible={false}>{icon}</Text>

        <Text style={styles.why} allowFontScaling>{why}</Text>

        <View style={styles.promiseBox}>
          <Text style={styles.promiseLabel} allowFontScaling>{onboardCopy.ourPromise}</Text>
          <Text style={styles.promise} allowFontScaling>{promise}</Text>
        </View>
      </View>
    </OnboardingSlide>
  );
}

const styles = StyleSheet.create({
  content:      { alignItems: 'center', paddingTop: theme.space.lg },
  icon:         { fontFamily: theme.fonts.headline, fontSize: 36, color: theme.colors.rewardYellow, marginBottom: 28, letterSpacing: 4, borderWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue, paddingHorizontal: theme.space.lg, paddingVertical: 10 },
  why:          { ...theme.type.uiLabel, fontSize: 15, color: theme.colors.textSecondary, lineHeight: 24, textAlign: 'center', marginBottom: theme.space['3xl'] },
  promiseBox:   { borderWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue, padding: theme.space.lg, backgroundColor: theme.colors.surface1, width: '100%' },
  promiseLabel: { ...theme.type.caption, fontWeight: 'bold', color: theme.colors.rewardYellow, letterSpacing: 2, marginBottom: theme.space.sm },
  promise:      { ...theme.type.bodyS, color: theme.colors.textSecondary, lineHeight: 20 },
});
