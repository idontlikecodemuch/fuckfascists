import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
 * Tapping the body opens the Track tab. Tapping DISMISS hides it for the session.
 *
 * Renders nothing when not Thursday or when dismissed.
 * Reusable for future nudge types via props.
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
    <View style={[styles.container, { top: insets.top }]} accessibilityRole="alert">
      <Pressable
        onPress={onPress}
        style={styles.body}
        accessibilityRole="button"
        accessibilityLabel={platformsCopy.nudgeBanner}
      >
        <Text style={styles.text} numberOfLines={1} allowFontScaling>
          {platformsCopy.nudgeBanner}
        </Text>
      </Pressable>
      <Pressable
        onPress={handleDismiss}
        style={styles.dismissBtn}
        accessibilityRole="button"
        accessibilityLabel={platformsCopy.nudgeDismissA11y}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.dismissText} allowFontScaling={false}>
          {platformsCopy.nudgeDismiss}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.rewardYellow,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.sm,
    minHeight: theme.a11y.minTapTarget,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    minHeight: theme.a11y.minTapTarget,
  },
  text: {
    ...theme.type.uiLabel,
    color: theme.colors.bgVoid,
  },
  dismissBtn: {
    minWidth: theme.a11y.minTapTarget,
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.space.sm,
  },
  dismissText: {
    ...theme.type.caption,
    color: theme.colors.bgVoid,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
