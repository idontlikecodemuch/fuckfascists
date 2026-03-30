import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { sharedCopy } from '../../../copy/shared';
import { theme } from '../../../design/tokens';

interface WelcomeScreenProps {
  stepIndex: number;
  onNext: () => void;
}

/**
 * Screen 1 — Welcome + How It Works (combined).
 * App name, tagline, body copy, then three feature one-liners.
 */
const HERO_LOGO_ASPECT = 1466 / 827;
const HERO_LOGO_MAX_HEIGHT_RATIO = 0.22; // ~22% of screen height — comfortably under half

export function WelcomeScreen({ stepIndex, onNext }: WelcomeScreenProps) {
  const { height: screenHeight } = useWindowDimensions();
  const logoMaxHeight = Math.round(screenHeight * HERO_LOGO_MAX_HEIGHT_RATIO);
  const logoHeight = Math.min(logoMaxHeight, 160);
  const logoWidth = logoHeight * HERO_LOGO_ASPECT;

  return (
    <OnboardingSlide stepIndex={stepIndex} title={onboardCopy.welcomeTitle} nextLabel={onboardCopy.letsGo} onNext={onNext}>
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

        <View style={styles.features}>
          <Text style={styles.feature} allowFontScaling>{onboardCopy.featureMap}</Text>
          <Text style={styles.feature} allowFontScaling>{onboardCopy.featureTrack}</Text>
          <Text style={styles.feature} allowFontScaling>{onboardCopy.featureScan}</Text>
          <Text style={styles.feature} allowFontScaling>{onboardCopy.featureScorecard}</Text>
        </View>
      </View>
    </OnboardingSlide>
  );
}

const styles = StyleSheet.create({
  content:  { alignItems: 'flex-start' },
  heroLogo: { marginBottom: theme.space.xl },
  tagline:  { ...theme.type.displayS, color: theme.colors.textPrimary, lineHeight: 28, marginBottom: theme.space['2xl'] },
  divider:  { width: 48, height: 4, backgroundColor: theme.colors.dangerRed, marginBottom: theme.space['2xl'] },
  body:     { ...theme.type.bodyM, color: theme.colors.textSecondary, lineHeight: 22, marginBottom: theme.space.lg },
  features: { gap: theme.space.sm },
  feature:  { ...theme.type.caption, fontWeight: 'bold', color: theme.colors.rewardYellow, letterSpacing: 1 },
});
