import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';

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
    await onAllow();
    // onAllow is responsible for advancing the step
  }

  return (
    <OnboardingSlide
      stepIndex={stepIndex}
      title={title}
      nextLabel={requesting ? '...' : allowLabel}
      onNext={handleAllow}
      onSkip={onSkip}
    >
      <View style={styles.content}>
        <Text style={styles.icon} accessible={false}>{icon}</Text>

        <Text style={styles.why} allowFontScaling>{why}</Text>

        <View style={styles.promiseBox}>
          <Text style={styles.promiseLabel} allowFontScaling>OUR PROMISE</Text>
          <Text style={styles.promise} allowFontScaling>{promise}</Text>
        </View>
      </View>
    </OnboardingSlide>
  );
}

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const RED   = '#CC0000';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  content:      { alignItems: 'center', paddingTop: 16 },
  icon:         { fontSize: 64, marginBottom: 28 },
  why:          { fontFamily: MONO, fontSize: 15, color: '#333', lineHeight: 24, textAlign: 'center', marginBottom: 32 },
  promiseBox:   { borderWidth: 3, borderColor: BLACK, padding: 16, backgroundColor: WHITE, width: '100%' },
  promiseLabel: { fontFamily: MONO, fontSize: 10, fontWeight: 'bold', color: RED, letterSpacing: 2, marginBottom: 8 },
  promise:      { fontFamily: MONO, fontSize: 12, color: '#555', lineHeight: 20 },
});
