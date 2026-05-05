import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { bevelFocusRaised } from '../../design/bevel';
import { theme } from '../../design/tokens';
import { fillSelf, flexChild } from '../../design/layout';
import { ALERT_BANNER_PULSE_MS } from '../../config/constants';

interface AlertBannerProps {
  /** Short Bungee label shown above the body. Optional. */
  title?: string;
  /** Body text — IBM Plex. */
  body: string;
  /** Tap handler for the banner body. When present, body becomes a button. */
  onPress?: () => void;
  /** When present, a × dismiss control renders on the right. */
  onDismiss?: () => void;
  /** A11y label for the body when pressable. Defaults to the body text. */
  bodyA11yLabel?: string;
  /** A11y label for the × dismiss button. */
  dismissA11yLabel?: string;
  /** Positioning style applied by the parent. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Reusable alert banner — cockpit cyan surface with bevelFocusRaised frame,
 * outer cyan glow, and a slow scale pulse for "incoming" emphasis.
 *
 * Presentational component. The parent owns positioning, trigger logic, and
 * dismiss state. See NudgeBanner for the Thursday scorecard example.
 *
 * Reduced motion: pulse holds at scale 1, no animation.
 *
 * #154 — swapped the wiggle (translateY + rotate + scale) for a scale-only
 * pulse so the alert reads more authoritative. Tooltip keeps the wiggle.
 */
export function AlertBanner({
  title,
  body,
  onPress,
  onDismiss,
  bodyA11yLabel,
  dismissA11yLabel,
  style,
}: AlertBannerProps) {
  const scale = useScalePulse();

  const content = (
    <View style={styles.content}>
      {title && (
        <Text style={styles.title} allowFontScaling numberOfLines={1}>
          {title}
        </Text>
      )}
      <Text style={styles.bodyText} allowFontScaling numberOfLines={2}>
        {body}
      </Text>
    </View>
  );

  return (
    <Animated.View
      style={[styles.outer, style, { transform: [{ scale }] }]}
      accessibilityRole="alert"
    >
      <View style={styles.panel}>
        {onPress ? (
          <Pressable
            onPress={onPress}
            style={styles.bodyPress}
            accessibilityRole="button"
            accessibilityLabel={bodyA11yLabel ?? `${title ? title + '. ' : ''}${body}`}
          >
            {content}
          </Pressable>
        ) : (
          <View style={styles.bodyPress}>{content}</View>
        )}

        {onDismiss && (
          <Pressable
            onPress={onDismiss}
            style={styles.dismiss}
            accessibilityRole="button"
            accessibilityLabel={dismissA11yLabel ?? 'Dismiss'}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.dismissIcon} allowFontScaling={false}>
              {'\u00d7'}
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const DISMISS_ICON_SIZE = 22;

/**
 * Slow scale pulse — 1.0 → 1.04 → 1.0 — for an "incoming" alert. Local to
 * AlertBanner; Tooltip keeps `useWiggleAnimation` for its hint behavior.
 *
 * Reduced motion: returns Animated.Value(1), no loop.
 */
function useScalePulse(): Animated.Value | Animated.AnimatedInterpolation<number> {
  const anim = useRef(new Animated.Value(0)).current;
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (cancelled) return;
      if (enabled) { setReducedMotion(true); return; }
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: ALERT_BANNER_PULSE_MS / 2, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: ALERT_BANNER_PULSE_MS / 2, useNativeDriver: true }),
        ]),
      ).start();
    });
    return () => { cancelled = true; anim.stopAnimation(); };
  }, [anim]);

  if (reducedMotion) return new Animated.Value(1);
  return anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] });
}

const styles = StyleSheet.create({
  outer: {
    shadowColor: theme.colors.focusAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  panel: {
    ...fillSelf,
    ...bevelFocusRaised,
    backgroundColor: theme.colors.focusAccent,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
    minHeight: theme.a11y.minTapTarget,
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 4,
        blurRadius: theme.glow.blurRadius,
        spreadDistance: theme.glow.spreadDistance,
        inset: true,
        color: theme.glow.color,
      },
      {
        offsetX: 0,
        offsetY: -4,
        blurRadius: theme.glow.blurRadius,
        spreadDistance: theme.glow.spreadDistance,
        inset: true,
        color: theme.glow.color,
      },
    ],
  },
  content: {
    ...flexChild,
    justifyContent: 'center',
  },
  bodyPress: {
    flex: 1,
    ...flexChild,
    justifyContent: 'center',
    minHeight: theme.a11y.minTapTarget,
  },
  title: {
    ...theme.type.displayS,
    fontSize: 14,
    lineHeight: 16,
    color: theme.colors.textPrimary,
    letterSpacing: 1,
  },
  bodyText: {
    ...theme.type.bodyS,
    color: theme.colors.textPrimary,
  },
  dismiss: {
    minWidth: theme.a11y.minTapTarget,
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.space.sm,
  },
  dismissIcon: {
    fontFamily: theme.fonts.headline,
    fontSize: DISMISS_ICON_SIZE,
    lineHeight: DISMISS_ICON_SIZE + 2,
    color: theme.colors.textPrimary,
  },
});
