import React, { useState, useCallback } from 'react';
import { SlidingAlertBanner } from '../../../core/ui/SlidingAlertBanner';
import { platformsCopy } from '../../../copy/platforms';
import { NUDGE_DAY } from '../../../config/constants';

interface NudgeBannerProps {
  /** Called when the user taps the banner body (navigates to Scorecard tab). */
  onPress: () => void;
  /** Called when the banner becomes visible/hidden so screens can avoid it. */
  onVisibleChange?: (visible: boolean) => void;
  /** Reports the rendered banner height so AppShell can reserve space. */
  onHeightChange?: (height: number) => void;
}

/**
 * App-wide dismissible nudge banner.
 * Shows on Thursday (NUDGE_DAY) with pump-up copy.
 * Tapping the body opens the Scorecard tab. Tapping × or swiping up hides it
 * for the session.
 *
 * Renders nothing when not Thursday or when dismissed. SlidingAlertBanner
 * owns the motion, dismiss gestures and safe-area positioning.
 */
export function NudgeBanner({ onPress, onVisibleChange, onHeightChange }: NudgeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const handleHidden = useCallback(() => setDismissed(true), []);

  const isNudgeDay = new Date().getDay() === NUDGE_DAY; // 0=Sun
  if (!isNudgeDay || dismissed) return null;

  return (
    <SlidingAlertBanner
      title={platformsCopy.nudgeBannerTitle}
      body={platformsCopy.nudgeBody}
      onPress={onPress}
      onHidden={handleHidden}
      dismissA11yLabel={platformsCopy.nudgeDismissA11y}
      onVisibleChange={onVisibleChange}
      onHeightChange={onHeightChange}
      showSparkles
    />
  );
}
