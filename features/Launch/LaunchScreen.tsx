import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, AccessibilityInfo, useWindowDimensions, Image } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { launchCopy } from '../../copy/launch';
import { sharedCopy } from '../../copy/shared';
import { theme } from '../../design/tokens';
import {
  LAUNCH_HERO_LOGO_MAX_HEIGHT,
  LAUNCH_HERO_LOGO_MAX_WIDTH,
} from '../../config/constants';

const LAUNCH_DATE_KEY = 'ff_last_launch_date';
const AUTO_DISMISS_MS = 3000;
const HERO_LOGO_ASPECT = 1466 / 827;

/**
 * Daily launch screen — shown once per calendar day.
 * Rotating daily message, pulsing "TAP TO START", auto-dismisses after 3s.
 * Logo breathes with a subtle scale pulse — video game title screen energy.
 */
export function LaunchScreen({ onDismiss }: { onDismiss: () => void }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [reducedMotion, setReducedMotion] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!cancelled) setReducedMotion(v);
    });
    return () => { cancelled = true; };
  }, []);

  // Pulsing animation for TAP TO START
  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, pulseAnim]);

  // Subtle breathing scale on the logo — title screen energy
  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoScale, { toValue: 1.04, duration: 1500, useNativeDriver: true }),
        Animated.timing(logoScale, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reducedMotion, logoScale]);

  // Keep a stable ref to onDismiss so the timer fires exactly once on mount.
  // Without this, an unstable onDismiss reference restarts the 5s timer on
  // every parent re-render, causing unpredictable dismiss timing.
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Auto-dismiss after 5 seconds — runs once on mount, no dependency on callback identity.
  useEffect(() => {
    const timer = setTimeout(() => onDismissRef.current(), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  // Pick a random message each app open
  const [message] = useState(() =>
    launchCopy.messages[Math.floor(Math.random() * launchCopy.messages.length)]
  );

  // Keep the title logo visually prominent without letting it dominate
  // larger phones/tablets.
  const logoMaxWidth = Math.min(screenWidth - theme.space['3xl'] * 2, LAUNCH_HERO_LOGO_MAX_WIDTH);
  const logoMaxScreenHeight = Math.round(screenHeight * 0.22);
  const logoWidth = Math.min(logoMaxWidth, Math.min(LAUNCH_HERO_LOGO_MAX_HEIGHT, logoMaxScreenHeight) * HERO_LOGO_ASPECT);
  const logoHeight = logoWidth / HERO_LOGO_ASPECT;

  return (
    <Pressable
      style={styles.container}
      onPress={onDismiss}
      accessibilityRole="button"
      accessibilityLabel={launchCopy.tapLabel}
    >
      <View style={styles.content}>
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <Image
            source={require('../../assets/pixel/brand/FF_logo.png')}
            style={[styles.heroLogo, { width: logoWidth, height: logoHeight }]}
            resizeMode="contain"
            accessibilityLabel={sharedCopy.appName}
          />
        </Animated.View>

        <Text style={styles.productSubtitle} allowFontScaling={false}>
          {sharedCopy.productSubtitle}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.message} allowFontScaling>
          {message}
        </Text>

        <Animated.Text style={[styles.tapToStart, { opacity: pulseAnim }]} allowFontScaling={false}>
          {launchCopy.tapToStart}
        </Animated.Text>
      </View>
    </Pressable>
  );
}

/**
 * Returns true if the launch screen should be shown (not yet seen today).
 * Marks the current date as seen.
 */
export async function shouldShowLaunchScreen(): Promise<boolean> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  try {
    const lastDate = await SecureStore.getItemAsync(LAUNCH_DATE_KEY);
    if (lastDate === today) return false;
    await SecureStore.setItemAsync(LAUNCH_DATE_KEY, today);
    return true;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: theme.space['3xl'],
  },
  heroLogo: {
    alignSelf: 'center',
    marginBottom: theme.space.sm,
  },
  productSubtitle: {
    fontFamily: theme.fonts.headline,
    fontSize: 18,
    color: theme.colors.rewardYellow,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(255,201,60,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    textAlign: 'center',
  },
  divider: {
    width: 48,
    height: 4,
    backgroundColor: theme.colors.dangerRed,
    marginVertical: theme.space['2xl'],
  },
  message: {
    ...theme.type.bodyM,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.space['3xl'],
  },
  tapToStart: {
    ...theme.type.displayS,
    color: theme.colors.rewardYellow,
    letterSpacing: 4,
  },
});
