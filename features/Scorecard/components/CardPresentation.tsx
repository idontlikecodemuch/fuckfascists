import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { MoneyParticles } from '../../Map/components/MoneyParticles';
import { SCREEN_SHAKE_MS } from '../../../config/constants';

const DISMISS_THRESHOLD = 120;

interface CardPresentationProps {
  pngUri: string;
  onDismiss: () => void;
}

/**
 * State 3: Full-screen card takeover — the trophy moment.
 *
 * Displays the rendered PNG edge-to-edge with celebration effects on reveal.
 * SHARE button at bottom. Swipe-down + X dismiss.
 */
export function CardPresentation({ pngUri, onDismiss }: CardPresentationProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const [showParticles, setShowParticles] = useState(true);

  // Screen shake on mount
  const fireShake = useCallback(() => {
    const pattern = [2, -2, 2, -2, 0];
    const step = SCREEN_SHAKE_MS / pattern.length;
    Animated.sequence(
      pattern.map((v) =>
        Animated.timing(shakeX, { toValue: v, duration: step, useNativeDriver: true }),
      ),
    ).start();
  }, [shakeX]);

  // Trigger celebrations on first render
  React.useEffect(() => {
    fireShake();
    const timer = setTimeout(() => setShowParticles(false), 1200);
    return () => clearTimeout(timer);
  }, [fireShake]);

  // Swipe-down to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10,
      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) translateY.setValue(gs.dy);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy > DISMISS_THRESHOLD) {
          Animated.timing(translateY, {
            toValue: 800,
            duration: 200,
            useNativeDriver: true,
          }).start(onDismiss);
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  const handleShare = useCallback(async () => {
    await Share.share({ url: pngUri });
  }, [pngUri]);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateX: shakeX }, { translateY }] }]}
      {...panResponder.panHandlers}
    >
      {/* Card image */}
      <Image source={{ uri: pngUri }} style={styles.image} resizeMode="contain" />

      {/* Celebration particles */}
      {showParticles && <MoneyParticles originY={200} />}

      {/* Dismiss X */}
      <Pressable
        style={styles.dismissBtn}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={scorecardCopy.dismissLabel}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.dismissText}>{'\u2715'}</Text>
      </Pressable>

      {/* Share button */}
      <Pressable
        style={styles.shareBtn}
        onPress={handleShare}
        accessibilityRole="button"
        accessibilityLabel={scorecardCopy.shareLabel}
      >
        <Text style={styles.shareBtnText} allowFontScaling={false}>
          {scorecardCopy.shareBtn}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.bgVoid,
    zIndex: 100,
  },
  image: {
    flex: 1,
    width: '100%',
  },
  dismissBtn: {
    position: 'absolute',
    top: 56,
    right: 16,
    width: theme.a11y.minTapTarget,
    height: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 22,
  },
  dismissText: {
    fontSize: 20,
    color: theme.colors.textPrimary,
  },
  shareBtn: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: theme.colors.rewardYellow,
    paddingHorizontal: theme.space['3xl'],
    paddingVertical: theme.space.md,
    borderRadius: theme.radii.button,
    minWidth: 160,
    alignItems: 'center',
  },
  shareBtnText: {
    fontFamily: theme.fonts.headline,
    fontSize: 18,
    color: theme.colors.bgVoid,
    letterSpacing: 3,
  },
});
