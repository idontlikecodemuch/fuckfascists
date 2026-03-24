import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { captureScreen } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import { betaCopy } from '../../copy/beta';
import { theme } from '../../design/tokens';
import { resetAppStateForFreshTest } from './resetAppState';
import {
  BETA_FLOATING_BUTTON_BOTTOM,
  BETA_FLOATING_BUTTON_SIZE,
  BETA_RESET_BUTTON_GAP,
  BETA_RESET_BUTTON_HEIGHT,
  BETA_RESET_BUTTON_WIDTH,
  SAFE_AREA_TOP_MIN,
} from '../../config/constants';

const FLOATING_BUTTON_HIT_SLOP = {
  top: theme.space.sm,
  bottom: theme.space.sm,
  left: theme.space.sm,
  right: theme.space.sm,
} as const;

/**
 * Floating beta overlay — shown when beta mode is active.
 * - "BETA" indicator badge in top-left
 * - "BUG" floating button in bottom-left — captures screenshot and saves to camera roll
 */
export function BetaOverlay() {
  const capturing = useRef(false);

  const handleBugReport = useCallback(async () => {
    if (capturing.current) return;
    capturing.current = true;
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(betaCopy.screenshotFailed);
        return;
      }
      const uri = await captureScreen({ format: 'png', quality: 1 });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert(betaCopy.screenshotSaved);
    } catch {
      Alert.alert(betaCopy.screenshotFailed);
    } finally {
      capturing.current = false;
    }
  }, []);

  const handleReset = useCallback(() => {
    Alert.alert(
      betaCopy.resetConfirmTitle,
      betaCopy.resetConfirmBody,
      [
        { text: betaCopy.resetCancelAction, style: 'cancel' },
        {
          text: betaCopy.resetConfirmAction,
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAppStateForFreshTest();
              Alert.alert(betaCopy.resetDone);
            } catch {
              Alert.alert(betaCopy.resetFailed);
            }
          },
        },
      ]
    );
  }, []);

  return (
    <>
      {/* Beta indicator */}
      <View style={styles.badge} pointerEvents="none">
        <Text style={styles.badgeText} accessibilityLabel={betaCopy.indicatorLabel}>
          {betaCopy.indicator}
        </Text>
      </View>

      {/* Bug report button */}
      <Pressable
        style={styles.resetButton}
        onPress={handleReset}
        accessibilityRole="button"
        accessibilityLabel={betaCopy.resetButtonLabel}
        hitSlop={FLOATING_BUTTON_HIT_SLOP}
      >
        <Text style={styles.resetText}>{betaCopy.resetButton}</Text>
      </Pressable>

      <Pressable
        style={styles.bugButton}
        onPress={handleBugReport}
        accessibilityRole="button"
        accessibilityLabel={betaCopy.bugButtonLabel}
        hitSlop={FLOATING_BUTTON_HIT_SLOP}
      >
        <Text style={styles.bugText}>{betaCopy.bugButton}</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: SAFE_AREA_TOP_MIN,
    left: theme.space.md,
    backgroundColor: theme.colors.dangerRed,
    paddingHorizontal: theme.space.sm,
    paddingVertical: 2,
    zIndex: 999,
  },
  badgeText: {
    ...theme.type.caption,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    letterSpacing: 2,
  },
  bugButton: {
    position: 'absolute',
    bottom: BETA_FLOATING_BUTTON_BOTTOM,
    left: theme.space.md,
    width: BETA_FLOATING_BUTTON_SIZE,
    height: BETA_FLOATING_BUTTON_SIZE,
    backgroundColor: theme.colors.dangerRed,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.frameBlue,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  resetButton: {
    position: 'absolute',
    bottom: BETA_FLOATING_BUTTON_BOTTOM + BETA_FLOATING_BUTTON_SIZE + BETA_RESET_BUTTON_GAP,
    left: theme.space.md,
    width: BETA_RESET_BUTTON_WIDTH,
    height: BETA_RESET_BUTTON_HEIGHT,
    backgroundColor: theme.colors.bgNav,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.rewardYellow,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  bugText: {
    ...theme.type.caption,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    letterSpacing: 1,
  },
  resetText: {
    ...theme.type.caption,
    fontWeight: 'bold',
    color: theme.colors.rewardYellow,
    letterSpacing: 1,
  },
});
