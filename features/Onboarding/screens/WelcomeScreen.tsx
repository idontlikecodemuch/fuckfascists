import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { sharedCopy } from '../../../copy/shared';
import { theme } from '../../../design/tokens';
import { glowDividerLine } from '../../../design/bevel';

const FEATURE_ICON_SIZE = 28;
const FEATURES: { name: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: onboardCopy.featureMap,   icon: 'map-outline' },
  { name: onboardCopy.featureTrack, icon: 'checkmark-done-outline' },
  { name: onboardCopy.featureScan,  icon: 'barcode-outline' },
];

interface WelcomeScreenProps {
  stepIndex: number;
  onNext: () => void;
}

const HERO_LOGO_ASPECT = 1466 / 827;
const HERO_LOGO_MAX_HEIGHT_RATIO = 0.22;

/**
 * Screen 1 — Welcome (Sh*tposter voice).
 * Centered layout: app logo, tagline, feature row, body.
 */
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

        <Text style={styles.productSubtitle} allowFontScaling={false}>
          {sharedCopy.productSubtitle}
        </Text>

        <Text style={styles.tagline} allowFontScaling>
          {onboardCopy.tagline}
        </Text>

        {/* #157 — feature row paired with tab-bar icons (Map / Track / Scan)
            so users see the three surfaces at a glance before getting into
            the privacy/permissions screens. */}
        <View
          style={styles.featureRow}
          accessibilityRole="text"
          accessibilityLabel={`${onboardCopy.featureMap}, ${onboardCopy.featureTrack}, ${onboardCopy.featureScan}`}
        >
          {FEATURES.map(({ name, icon }) => (
            <View key={name} style={styles.featureItem}>
              <Ionicons name={icon} size={FEATURE_ICON_SIZE} color={theme.colors.glowCyan} />
              <Text style={styles.featureLabel} allowFontScaling={false}>{name}</Text>
            </View>
          ))}
        </View>

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
  heroLogo: { marginBottom: theme.space.sm },
  productSubtitle: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 13,
    letterSpacing: 3,
    color: theme.colors.glowCyan,
    opacity: 0.85,
    textShadowColor: 'rgba(122,242,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginBottom: theme.space.xl,
    textAlign: 'center',
  },
  tagline: {
    ...theme.type.displayS,
    color: theme.colors.textPrimary,
    lineHeight: 28,
    marginBottom: theme.space['2xl'],
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingHorizontal: theme.space.xl,
    marginBottom: theme.space['2xl'],
  },
  featureItem: {
    alignItems: 'center',
  },
  featureLabel: {
    ...theme.type.bodyS,
    color: theme.colors.textPrimary,
    marginTop: theme.space.xs,
    letterSpacing: 1,
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
