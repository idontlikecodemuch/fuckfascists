import React from 'react';
import { View, Text, Linking, StyleSheet } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { sharedCopy } from '../../../copy/shared';
import { theme } from '../../../design/tokens';
import { bevelInset } from '../../../design/bevel';

interface PrivacyScreenProps {
  stepIndex: number;
  onNext: () => void;
}

/**
 * Screen 2 — Privacy (Clark voice).
 * Single consolidated privacy statement + open-source link.
 */
export function PrivacyScreen({ stepIndex, onNext }: PrivacyScreenProps) {
  return (
    <OnboardingSlide stepIndex={stepIndex} title={onboardCopy.privacyTitle} onNext={onNext}>
      <View style={styles.container}>
        <View style={styles.panel}>
          <View style={styles.accentBar} accessible={false} />
          <View style={styles.textBlock}>
            <Text style={styles.body} allowFontScaling>
              {onboardCopy.privacyBody}
            </Text>
          </View>
        </View>

        <Text
          style={styles.link}
          onPress={() => Linking.openURL(sharedCopy.repoUrl)}
          accessibilityRole="link"
          accessibilityLabel={onboardCopy.openSourceLink}
          allowFontScaling
        >
          {onboardCopy.openSourceLink}
        </Text>
      </View>
    </OnboardingSlide>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', gap: theme.space.xl },
  panel: {
    ...bevelInset,
    backgroundColor: theme.colors.panelInner,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: {
    width: 6,
    backgroundColor: theme.colors.focusAccent,
  },
  textBlock: {
    flex: 1,
    paddingVertical: theme.space.lg,
    paddingHorizontal: theme.space.lg,
  },
  body: {
    ...theme.type.bodyM,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  link: {
    ...theme.type.bodyS,
    color: theme.colors.highlightBlue,
    textAlign: 'center',
  },
});
