import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertBanner } from './AlertBanner';
import { theme } from '../../design/tokens';

interface SlidingAlertBannerProps {
  title: string;
  body: string;
  /** Body tap. The banner slides away afterwards. */
  onPress: () => void;
  /** Called once the banner has slid away (×, swipe up, body or secondary tap). */
  onHidden: () => void;
  dismissA11yLabel: string;
  bodyA11yLabel?: string;
  /** Optional text button beside the ×. The banner slides away afterwards. */
  secondaryLabel?: string;
  secondaryA11yLabel?: string;
  onSecondaryPress?: () => void;
  /** Reports visibility so screens can avoid the banner. */
  onVisibleChange?: (visible: boolean) => void;
  /** Reports the rendered banner height so AppShell can reserve space. */
  onHeightChange?: (height: number) => void;
  showSparkles?: boolean;
}

const HIDDEN_OFFSET_Y = -180;
const SWIPE_DISMISS_DY = -36;
const SWIPE_DISMISS_VY = -0.65;
const WOBBLE_STEPS = [5, -3, 4, -2, 2, 0];
const WOBBLE_STEP_MS = 70;

/**
 * Full-bleed alert banner pinned under the status bar: slides in with a
 * small wobble when mounted, slides out on ×, swipe up, or a tap. The parent
 * decides when to mount it and unmounts it from onHidden. Shared by the
 * Thursday nudge and the alerts-off banner; AlertBanner draws the surface.
 */
export function SlidingAlertBanner({
  title,
  body,
  onPress,
  onHidden,
  dismissA11yLabel,
  bodyA11yLabel,
  secondaryLabel,
  secondaryA11yLabel,
  onSecondaryPress,
  onVisibleChange,
  onHeightChange,
  showSparkles,
}: SlidingAlertBannerProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const insets = useSafeAreaInsets();
  const entryY = useRef(new Animated.Value(HIDDEN_OFFSET_Y)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const hidingRef = useRef(false);

  // Height comes from onLayout only: an estimate could land after the real
  // value and leave content under a taller banner.
  useEffect(() => {
    onVisibleChange?.(true);
    return () => {
      onVisibleChange?.(false);
      onHeightChange?.(0);
    };
  }, [onHeightChange, onVisibleChange]);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReducedMotion(enabled);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
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
      ...WOBBLE_STEPS.map((toValue) => Animated.timing(entryY, {
        toValue,
        duration: WOBBLE_STEP_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      })),
    ]).start();

    return () => { entryY.stopAnimation(); };
  }, [dragY, entryY, reducedMotion]);

  const hide = useCallback(() => {
    if (hidingRef.current) return;
    hidingRef.current = true;
    dragY.setValue(0);
    if (reducedMotion) {
      onHidden();
      return;
    }

    Animated.timing(entryY, {
      toValue: HIDDEN_OFFSET_Y,
      duration: 170,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onHidden();
    });
  }, [dragY, entryY, onHidden, reducedMotion]);

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
          hide();
          return;
        }
        resetDrag();
      },
      onPanResponderTerminate: resetDrag,
    }),
    [dragY, hide, resetDrag],
  );

  const handlePress = useCallback(() => {
    onPress();
    hide();
  }, [hide, onPress]);

  const handleSecondaryPress = useCallback(() => {
    onSecondaryPress?.();
    hide();
  }, [hide, onSecondaryPress]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    onHeightChange?.(Math.ceil(event.nativeEvent.layout.height));
  }, [onHeightChange]);

  const translateY = useMemo(() => Animated.add(entryY, dragY), [dragY, entryY]);

  return (
    <Animated.View
      style={[styles.position, { transform: [{ translateY }] }]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      <AlertBanner
        title={title}
        body={body}
        onPress={handlePress}
        onDismiss={hide}
        bodyA11yLabel={bodyA11yLabel}
        dismissA11yLabel={dismissA11yLabel}
        secondaryLabel={secondaryLabel}
        secondaryA11yLabel={secondaryA11yLabel}
        onSecondaryPress={onSecondaryPress ? handleSecondaryPress : undefined}
        panelStyle={{ paddingTop: insets.top + theme.space.sm }}
        showSparkles={showSparkles}
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
