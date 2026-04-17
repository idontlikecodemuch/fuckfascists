import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { sharedCopy } from '../../../copy/shared';
import { theme } from '../../../design/tokens';
import { glowDividerLine } from '../../../design/bevel';

interface WelcomeScreenProps {
  stepIndex: number;
  onNext: () => void;
}

const HERO_LOGO_ASPECT = 1466 / 827;
const HERO_LOGO_MAX_HEIGHT_RATIO = 0.22;

/**
 * Screen 1 — Welcome (Sh*tposter voice).
 * Centered layout: app logo, tagline, body. No feature lines — let the app teach itself.
 */
export function WelcomeScreen({ stepIndex, onNext }: WelcomeScreenProps) {
  const { height: screenHeight } = useWindowDimensions();
  const logoMaxHeight = Math.round(screenHeight * HERO_LOGO_MAX_HEIGHT_RATIO);
  const logoHeight = Math.min(logoMaxHeight, 160);
  const logoWidth = logoHeight * HERO_LOGO_ASPECT;

  return (
    <OnboardingSlide stepIndex={stepIndex} title={onboardCopy.appDisplay.replace('\n', ' ')} nextLabel={onboardCopy.letsGo} onNext={onNext}>
      <View style={styles.content}>
        <Image
          source={require('../../../assets/pixel/brand/FF_logo.png')}
          style={[styles.heroLogo, { width: logoWidth, height: logoHeight }]}
          resizeMode="contain"
          accessibilityLabel={sharedCopy.appName}
        />

        <Text style={styles.tagline} allowFontScaling>
          {onboardCopy.tagline}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.body} allowFontScaling>
          {onboardCopy.body}
        </Text>
      </View>
    </OnboardingSlide>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: 'center' },
  heroLogo: { marginBottom: theme.space.xl },
  tagline: {
    ...theme.type.displayS,
    color: theme.colors.textPrimary,
    lineHeight: 28,
    marginBottom: theme.space['2xl'],
    textAlign: 'center',
  },
  divider: {
    ...glowDividerLine,
    width: 48,
    marginBottom: theme.space['2xl'],
  },
  body: {
    ...theme.type.bodyM,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
});
