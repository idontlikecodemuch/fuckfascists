import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  PanResponder,
  Platform,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { addScreenshotListener } from 'expo-screen-capture';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { MoneyParticles } from '../../Map/components/MoneyParticles';
import {
  SCORECARD_REVEAL_DELAY_MS,
  SCORECARD_REVEAL_FADE_MS,
  SCORECARD_SHARE_SWIPE_UP_THRESHOLD,
  SCREEN_SHAKE_MS,
} from '../../../config/constants';
import { ChevronRunway } from './ChevronRunway';
import { CardHalo } from './CardHalo';
import { ShareButton } from './ShareButton';
import { useAppActive } from '../hooks/useAppActive';

const DISMISS_THRESHOLD = 120;
const RUNWAY_HEIGHT = 180;
const CARD_HORIZONTAL_PAD = 24;
const RUNWAY_WIDTH_PCT = 0.32;
const SHARE_BTN_WIDTH_PCT = 0.32;
const PARTICLE_BURST_MS = 1400;

interface CardPresentationProps {
  pngUri: string;
  onDismiss: () => void;
}

// Trophy moment — full-screen card takeover. iOS gets a pre-capture swap
// via AppState; Android gets a post-capture screenshot listener that
// auto-opens the share sheet with the clean PNG. See CLAUDE.md.
export function CardPresentation({ pngUri, onDismiss }: CardPresentationProps) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const appActive = useAppActive();

  const translateY = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const runwayOpacity = useRef(new Animated.Value(0)).current;
  const [showParticles, setShowParticles] = useState(true);

  const { cardW, cardH } = useMemo(() => {
    const availableW = screenW - CARD_HORIZONTAL_PAD * 2;
    const availableH = screenH - RUNWAY_HEIGHT - 80;
    const w = Math.min(availableW, (availableH * 9) / 16);
    return { cardW: w, cardH: (w * 16) / 9 };
  }, [screenW, screenH]);

  const runwayWidth = Math.round(screenW * RUNWAY_WIDTH_PCT);
  const shareBtnWidth = Math.round(screenW * SHARE_BTN_WIDTH_PCT);

  useEffect(() => {
    const pattern = [2, -2, 2, -2, 0];
    const step = SCREEN_SHAKE_MS / pattern.length;
    Animated.sequence(
      pattern.map((v) =>
        Animated.timing(shakeX, { toValue: v, duration: step, useNativeDriver: true }),
      ),
    ).start();

    const runwayTimer = setTimeout(() => {
      Animated.timing(runwayOpacity, {
        toValue: 1,
        duration: SCORECARD_REVEAL_FADE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }, SCORECARD_REVEAL_DELAY_MS);
    const particleTimer = setTimeout(() => setShowParticles(false), PARTICLE_BURST_MS);

    return () => {
      clearTimeout(runwayTimer);
      clearTimeout(particleTimer);
    };
  }, [shakeX, runwayOpacity]);

  // iOS: RN Share. Android: expo-sharing (RN's `url` is iOS-only).
  const handleShare = useCallback(async () => {
    try {
      if (Platform.OS === 'ios') {
        await Share.share({ url: pngUri });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pngUri, {
          mimeType: 'image/png',
          dialogTitle: 'Share scorecard',
        });
      }
    } catch {
      // User cancel or platform error — non-fatal.
    }
  }, [pngUri]);

  // Android post-capture parity: Android exposes no pre-capture hook, so we
  // can't swap the bitmap like iOS. Closest we can offer — detect the post-
  // capture event and auto-open the share sheet with the clean PNG. The
  // chrome screenshot still lands in Photos; this just makes the gesture
  // also produce the clean-PNG share flow. No-op on iOS (AppState wins).
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = addScreenshotListener(() => handleShare());
    return () => sub.remove();
  }, [handleShare]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 10,
        onPanResponderMove: (_, gs) => translateY.setValue(gs.dy),
        onPanResponderRelease: (_, gs) => {
          if (gs.dy > DISMISS_THRESHOLD) {
            Animated.timing(translateY, {
              toValue: screenH,
              duration: 200,
              useNativeDriver: true,
            }).start(onDismiss);
            return;
          }
          if (gs.dy < -SCORECARD_SHARE_SWIPE_UP_THRESHOLD) {
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start(() => {
              handleShare();
            });
            return;
          }
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [translateY, screenH, onDismiss, handleShare],
  );

  if (!appActive) {
    return (
      <View style={styles.intercept}>
        <StatusBar hidden />
        <Image source={{ uri: pngUri }} style={styles.fullBleed} resizeMode="contain" />
      </View>
    );
  }

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateX: shakeX }, { translateY }] }]}
      {...panResponder.panHandlers}
    >
      <Pressable
        style={styles.dismissBtn}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel={scorecardCopy.dismissLabel}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Text style={styles.dismissText}>{'✕'}</Text>
      </Pressable>

      <View style={styles.cardArea}>
        <View style={[styles.cardWrap, { width: cardW, height: cardH }]}>
          <CardHalo width={cardW} height={cardH} />
          <Image source={{ uri: pngUri }} style={styles.cardImage} resizeMode="contain" />

          {showParticles && (
            <>
              <View style={[styles.particleHost, { top: -8, left: -8 }]}>
                <MoneyParticles originY={0} />
              </View>
              <View style={[styles.particleHost, { top: -8, right: -8 }]}>
                <MoneyParticles originY={0} />
              </View>
              <View style={[styles.particleHost, { bottom: 0, left: -8 }]}>
                <MoneyParticles originY={0} />
              </View>
              <View style={[styles.particleHost, { bottom: 0, right: -8 }]}>
                <MoneyParticles originY={0} />
              </View>
            </>
          )}
        </View>
      </View>

      <Animated.View
        style={[styles.runway, { opacity: runwayOpacity, height: RUNWAY_HEIGHT }]}
      >
        <ChevronRunway width={runwayWidth} />
        <ShareButton width={shareBtnWidth} onPress={handleShare} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.bgVoid,
    zIndex: 100,
  },
  intercept: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.bgVoid,
    zIndex: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullBleed: { width: '100%', height: '100%' },
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
    zIndex: 30,
  },
  dismissText: { fontSize: 20, color: theme.colors.textPrimary },
  cardArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: CARD_HORIZONTAL_PAD,
    paddingTop: 56,
  },
  cardWrap: { alignItems: 'center', justifyContent: 'center' },
  cardImage: { width: '100%', height: '100%' },
  particleHost: {
    position: 'absolute',
    width: 1,
    height: 1,
    overflow: 'visible',
  },
  runway: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 36,
    gap: theme.space.md,
  },
});
