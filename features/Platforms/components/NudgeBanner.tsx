import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertBanner } from '../../../core/ui/AlertBanner';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import { NUDGE_DAY } from '../../../config/constants';

interface NudgeBannerProps {
  /** Called when the user taps the banner body (navigates to Scorecard tab). */
  onPress: () => void;
  /** Called when the banner becomes visible/hidden so screens can avoid it. */
  onVisibleChange?: (visible: boolean) => void;
  /** Reports the rendered banner height so AppShell can reserve space. */
  onHeightChange?: (height: number) => void;
}

const HIDDEN_OFFSET_Y = -180;
const SWIPE_DISMISS_DY = -36;
const SWIPE_DISMISS_VY = -0.65;

/**
 * App-wide dismissible nudge banner.
 * Shows on Thursday (NUDGE_DAY) with pump-up copy.
 * Tapping the body opens the Scorecard tab. Tapping × or swiping up hides it
 * for the session.
 *
 * Renders nothing when not Thursday or when dismissed.
 * AlertBanner handles the visual surface; this file owns the trigger, motion,
 * dismiss gestures, and safe-area/full-bleed positioning.
 */
export function NudgeBanner({ onPress, onVisibleChange, onHeightChange }: NudgeBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const insets = useSafeAreaInsets();
  const entryY = useRef(new Animated.Value(HIDDEN_OFFSET_Y)).current;
  const dragY = useRef(new Animated.Value(0)).current;

  const today = new Date().getDay(); // 0=Sun
  const isNudgeDay = today === NUDGE_DAY;

  useEffect(() => {
    const visible = isNudgeDay && !dismissed;
    onVisibleChange?.(visible);
    onHeightChange?.(
      visible
        ? Math.ceil(insets.top + theme.a11y.minTapTarget + theme.space.sm * 2)
        : 0,
    );
    return () => {
      onVisibleChange?.(false);
      onHeightChange?.(0);
    };
  }, [dismissed, insets.top, isNudgeDay, onHeightChange, onVisibleChange]);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReducedMotion(enabled);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isNudgeDay || dismissed) return;
    dragY.setValue(0);
    if (reducedMotion) {
      entryY.setValue(0);
      return;
    }

    entryY.setValue(HIDDEN_OFFSET_Y);
    Animated.sequence([
      Animated.timing(entryY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(entryY, {
        toValue: 5,
        duration: 70,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(entryY, {
        toValue: -3,
        duration: 70,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(entryY, {
        toValue: 4,
        duration: 70,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(entryY, {
        toValue: -2,
        duration: 70,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(entryY, {
        toValue: 2,
        duration: 70,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(entryY, {
        toValue: 0,
        duration: 70,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    return () => { entryY.stopAnimation(); };
  }, [dismissed, dragY, entryY, isNudgeDay, reducedMotion]);

  const finishDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const handleDismiss = useCallback(() => {
    dragY.setValue(0);
    if (reducedMotion) {
      finishDismiss();
      return;
    }

    Animated.timing(entryY, {
      toValue: HIDDEN_OFFSET_Y,
      duration: 170,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      finishDismiss();
    });
  }, [dragY, entryY, finishDismiss, reducedMotion]);

  const resetDrag = useCallback(() => {
    if (reducedMotion) {
      dragY.setValue(0);
      return;
    }

    Animated.spring(dragY, {
      toValue: 0,
      damping: 16,
      stiffness: 220,
      mass: 0.7,
      useNativeDriver: true,
    }).start();
  }, [dragY, reducedMotion]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy < -6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        dragY.setValue(Math.min(0, gesture.dy));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy <= SWIPE_DISMISS_DY || gesture.vy <= SWIPE_DISMISS_VY) {
          handleDismiss();
          return;
        }
        resetDrag();
      },
      onPanResponderTerminate: resetDrag,
    }),
    [dragY, handleDismiss, resetDrag],
  );

  const handlePress = useCallback(() => {
    onPress();
    handleDismiss();
  }, [handleDismiss, onPress]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    onHeightChange?.(Math.ceil(event.nativeEvent.layout.height));
  }, [onHeightChange]);

  const translateY = useMemo(() => Animated.add(entryY, dragY), [dragY, entryY]);

  if (!isNudgeDay || dismissed) return null;

  return (
    <Animated.View
      style={[styles.position, { transform: [{ translateY }] }]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <AlertBanner
        title={platformsCopy.nudgeBannerTitle}
        body={platformsCopy.nudgeBody}
        onPress={handlePress}
        onDismiss={handleDismiss}
        dismissA11yLabel={platformsCopy.nudgeDismissA11y}
        panelStyle={{ paddingTop: insets.top + theme.space.sm }}
        showSparkles
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  position: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
});
