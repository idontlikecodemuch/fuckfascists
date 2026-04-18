import React, { useState, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertBanner } from '../../../core/ui/AlertBanner';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { NUDGE_DAY } from '../../../config/constants';

interface NudgeBannerProps {
  /** Called when the user taps the banner body (navigates to Track tab). */
  onPress: () => void;
}

/**
 * App-wide dismissible nudge banner.
 * Shows on Thursday (NUDGE_DAY) with pump-up copy.
 * Tapping the body opens the Track tab. Tapping × hides it for the session.
 *
 * Renders nothing when not Thursday or when dismissed.
 * Visual surface is handled by AlertBanner — this file owns the trigger +
 * dismiss state + safe-area positioning only.
 */
export function NudgeBanner({ onPress }: NudgeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const insets = useSafeAreaInsets();

  const today = new Date().getDay(); // 0=Sun
  const isNudgeDay = today === NUDGE_DAY;

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  if (!isNudgeDay || dismissed) return null;

  return (
    <AlertBanner
      title={platformsCopy.nudgeBannerTitle}
      body={platformsCopy.nudgeBody}
      onPress={onPress}
      onDismiss={handleDismiss}
      dismissA11yLabel={platformsCopy.nudgeDismissA11y}
      style={[styles.position, { top: insets.top }]}
    />
  );
}

const styles = StyleSheet.create({
  position: {
    position: 'absolute',
    left: theme.space.sm,
    right: theme.space.sm,
    zIndex: 10,
  },
});
