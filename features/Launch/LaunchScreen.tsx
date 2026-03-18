import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, AccessibilityInfo, useWindowDimensions } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { launchCopy } from '../../copy/launch';
import { sharedCopy } from '../../copy/shared';
import { theme } from '../../design/tokens';

const LAUNCH_DATE_KEY = 'ff_last_launch_date';
const AUTO_DISMISS_MS = 5000;

/**
 * Daily launch screen — shown once per calendar day.
 * Rotating daily message, pulsing "TAP TO START", auto-dismisses after 5s.
 * Logo breathes with a subtle scale pulse — video game title screen energy.
 */
export function LaunchScreen({ onDismiss }: { onDismiss: () => void }) {
  const { width: screenWidth } = useWindowDimensions();
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

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Pick a rotating daily message based on day-of-year
  const messageIndex = Math.floor(Date.now() / 86400000) % launchCopy.messages.length;
  const message = launchCopy.messages[messageIndex];

  const logoWidth = screenWidth * 0.6;

  return (
    <Pressable
      style={styles.container}
      onPress={onDismiss}
      accessibilityRole="button"
      accessibilityLabel={launchCopy.tapLabel}
    >
      <View style={styles.content}>
        <Animated.Image
          source={require('../../assets/pixel/brand/FF_logo.png')}
          style={[styles.heroLogo, { width: logoWidth, transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
          accessibilityLabel={sharedCopy.appName}
        />

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
    aspectRatio: 1466 / 827,
    alignSelf: 'center',
    marginBottom: theme.space.md,
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
