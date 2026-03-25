import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { betaCopy } from '../../copy/beta';
import { harnessCopy } from '../../copy/harness';
import { theme } from '../../design/tokens';
import { resetAppStateForFreshTest } from './resetAppState';
import { captureBetaScreenshot } from './betaScreenshot';
import type { Tab } from '../../app/navigation/TabBar';
import {
  BETA_FLOATING_BUTTON_BOTTOM,
  BETA_FLOATING_BUTTON_SIZE,
  BETA_RESET_BUTTON_GAP,
  BETA_RESET_BUTTON_HEIGHT,
  BETA_RESET_BUTTON_WIDTH,
} from '../../config/constants';

const FLOATING_BUTTON_HIT_SLOP = {
  top: theme.space.sm,
  bottom: theme.space.sm,
  left: theme.space.sm,
  right: theme.space.sm,
} as const;

interface BetaOverlayProps {
  activeTab: Tab;
  /** Open the screenshot harness modal. Only provided in __DEV__. */
  onOpenHarness?: () => void;
}

/**
 * Floating beta overlay — shown when beta mode is active.
 * - "BETA" indicator badge in top-left
 * - "SHOTS" button — opens screenshot harness (dev only)
 * - "RESET" button — clears app state
 * - "BUG" button — captures single screenshot
 */
export function BetaOverlay({ activeTab, onOpenHarness }: BetaOverlayProps) {
  const capturing = useRef(false);

  const handleBugReport = useCallback(async () => {
    if (capturing.current) return;
    capturing.current = true;
    try {
      const filename = await captureBetaScreenshot(activeTab);
      Alert.alert(betaCopy.screenshotSaved(filename));
    } catch {
      Alert.alert(betaCopy.screenshotFailed);
    } finally {
      capturing.current = false;
    }
  }, [activeTab]);

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

  const resetBottom = BETA_FLOATING_BUTTON_BOTTOM + BETA_FLOATING_BUTTON_SIZE + BETA_RESET_BUTTON_GAP;
  const shotsBottom = resetBottom + BETA_RESET_BUTTON_HEIGHT + BETA_RESET_BUTTON_GAP;

  return (
    <>
      {/* Beta indicator */}
      <View style={styles.badge} pointerEvents="none">
        <Text style={styles.badgeText} accessibilityLabel={betaCopy.indicatorLabel}>
          {betaCopy.indicator}
        </Text>
      </View>

      {/* Screenshot harness button — dev only */}
      {onOpenHarness && (
        <Pressable
          style={[styles.shotsButton, { bottom: shotsBottom }]}
          onPress={onOpenHarness}
          accessibilityRole="button"
          accessibilityLabel={harnessCopy.shotsButtonLabel}
          hitSlop={FLOATING_BUTTON_HIT_SLOP}
        >
          <Text style={styles.shotsText}>{harnessCopy.shotsButton}</Text>
        </Pressable>
      )}

      {/* Reset button */}
      <Pressable
        style={styles.resetButton}
        onPress={handleReset}
        accessibilityRole="button"
        accessibilityLabel={betaCopy.resetButtonLabel}
        hitSlop={FLOATING_BUTTON_HIT_SLOP}
      >
        <Text style={styles.resetText}>{betaCopy.resetButton}</Text>
      </Pressable>

      {/* Bug report button */}
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
    top: 52,
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
  shotsButton: {
    position: 'absolute',
    left: theme.space.md,
    width: BETA_RESET_BUTTON_WIDTH,
    height: BETA_RESET_BUTTON_HEIGHT,
    backgroundColor: theme.colors.bgNav,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.highlightBlue,
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
  shotsText: {
    ...theme.type.caption,
    fontWeight: 'bold',
    color: theme.colors.highlightBlue,
    letterSpacing: 1,
  },
});
