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
 * Centered layout. App logo, tagline, body, then feature one-liners
 * with green checkmarks and Bungee function labels.
 */
const HERO_LOGO_ASPECT = 1466 / 827;
const HERO_LOGO_MAX_HEIGHT_RATIO = 0.22;

/** Feature items parsed from copy: "LABEL — description" */
const FEATURES = [
  onboardCopy.featureMap,
  onboardCopy.featureTrack,
  onboardCopy.featureScan,
  onboardCopy.featureScorecard,
] as const;

function parseFeature(raw: string): { label: string; desc: string } {
  const idx = raw.indexOf(' \u2014 ');
  if (idx === -1) return { label: raw, desc: '' };
  return { label: raw.slice(0, idx), desc: raw.slice(idx + 3) };
}

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
          {FEATURES.map((raw) => {
            const { label, desc } = parseFeature(raw);
            return (
              <Text key={label} style={styles.featureLine} allowFontScaling>
                <Text style={styles.checkmark}>{sharedCopy.checkmark} </Text>
                <Text style={styles.featureLabel}>{label}</Text>
                {desc ? (
                  <Text style={styles.featureDesc}> {'\u2014'} {desc}</Text>
                ) : null}
              </Text>
            );
          })}
        </View>
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
    width: 48,
    height: 4,
    backgroundColor: theme.colors.dangerRed,
    marginBottom: theme.space['2xl'],
  },
  body: {
    ...theme.type.bodyM,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.space.lg,
    textAlign: 'center',
  },
  features: { gap: theme.space.md, alignSelf: 'stretch' },
  featureLine: { lineHeight: 20 },
  checkmark: {
    ...theme.type.bodyM,
    color: theme.colors.successGreenText,
    fontWeight: 'bold',
  },
  featureLabel: {
    fontFamily: theme.fonts.headline,
    fontSize: 13,
    color: theme.colors.successGreenText,
    letterSpacing: 1,
  },
  featureDesc: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
  },
});
