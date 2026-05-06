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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import { StarFieldBg } from '../../../core/starbg';
import { SecureCaptureOverlay } from '../../../core/ui/SecureCaptureOverlay';
import { Tooltip } from '../../../core/ui/Tooltip';
import { usePersistentHints } from '../../../core/ui/usePersistentHints';
import { MoneyRainfall } from './MoneyRainfall';
import {
  MONEY_RAINFALL_DURATION_MS,
  SAFE_AREA_TOP_MIN,
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
const RUNWAY_HEIGHT = 150;            // chevron stack (3 thin triangles) + small SHARE word
const CARD_WIDTH_PCT = 0.85;          // card image width = 85% of screen width
const CHEVRON_WIDTH_PCT = 0.42;       // wide triangle width
const SHARE_TEXT_WIDTH_PCT = 0.40;
const PRESENTATION_HINT_MS = 6000;
const PRESENTATION_HINTS_KEY = 'scorecard_presentation_hints_seen';
const PRESENTATION_HINTS = [{ id: 'share', version: 'v1' }] as const;
type PresentationHintId = (typeof PRESENTATION_HINTS)[number]['id'];

interface CardPresentationProps {
  pngUri: string;
  onDismiss: () => void;
}

// Trophy moment — full-screen card takeover. iOS keeps the clean card as an
// unprotected base layer, then renders presentation chrome in a secure overlay
// that is hidden from screenshots. Android gets a post-capture screenshot
// listener that auto-opens the share sheet with the clean PNG. See CLAUDE.md.
export function CardPresentation({ pngUri, onDismiss }: CardPresentationProps) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const appActive = useAppActive();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(0)).current;
  const shakeX = useRef(new Animated.Value(0)).current;
  const runwayOpacity = useRef(new Animated.Value(0)).current;
  const [showParticles, setShowParticles] = useState(true);
  const [showPresentationHint, setShowPresentationHint] = useState(false);
  const {
    activeHint: activePresentationHint,
    dismiss: dismissPresentationHint,
  } = usePersistentHints<PresentationHintId>({
    storageKey: PRESENTATION_HINTS_KEY,
    hints: PRESENTATION_HINTS,
  });

  // SafeAreaProvider context can fail to propagate into absolute-positioned
  // takeover screens; SAFE_AREA_TOP_MIN is the documented floor for that case
  // (see CLAUDE.md "Configurable Variables"). Generous bonus on top so the
  // ornate gold frame on the rendered card sits well clear of the dynamic
  // island and reads as a centerpiece, not a fullscreen takeover.
  const topPad = Math.max(insets.top, SAFE_AREA_TOP_MIN) + 60;
  const bottomPad = theme.space.md; // keep the runway / SHARE close to the screen bottom
  const { cardW, cardH } = useMemo(() => {
    // Width-first: card fills 85% of screen width. If 9:16 height won't fit
    // between top inset + runway + bottom inset, scale down by height instead.
    const widthCapped = screenW * CARD_WIDTH_PCT;
    const heightAvailable = screenH - topPad - RUNWAY_HEIGHT - bottomPad;
    const heightCapped = (heightAvailable * 9) / 16;
    const w = Math.min(widthCapped, heightCapped);
    return { cardW: w, cardH: (w * 16) / 9 };
  }, [screenW, screenH, topPad, bottomPad]);

  const chevronWidth = Math.round(screenW * CHEVRON_WIDTH_PCT);
  const shareTextWidth = Math.round(screenW * SHARE_TEXT_WIDTH_PCT);

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
    const particleTimer = setTimeout(() => setShowParticles(false), MONEY_RAINFALL_DURATION_MS);

    return () => {
      clearTimeout(runwayTimer);
      clearTimeout(particleTimer);
    };
  }, [shakeX, runwayOpacity]);

  useEffect(() => {
    if (activePresentationHint !== 'share') return;

    setShowPresentationHint(true);
    const timer = setTimeout(() => {
      setShowPresentationHint(false);
      dismissPresentationHint('share').catch(() => undefined);
    }, PRESENTATION_HINT_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [activePresentationHint, dismissPresentationHint]);

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
  // can't hide the chrome before the bitmap lands. Closest we can offer —
  // detect the post-capture event and auto-open the share sheet with the
  // clean card image. iOS uses the secure overlay instead.
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
      {Platform.OS === 'ios' && (
        <>
          <StatusBar hidden />
          <View style={styles.captureBase} pointerEvents="none">
            <Image source={{ uri: pngUri }} style={styles.fullBleed} resizeMode="contain" />
          </View>
        </>
      )}

      <SecureCaptureOverlay style={styles.presentationLayer}>
        {Platform.OS === 'ios' && <StarFieldBg seed="scorecard-presentation" />}

        {/* Falling money — large, scattered. Bursts on reveal then stops so it
            doesn't permanently obscure the card. */}
        {showParticles && <MoneyRainfall screenW={screenW} screenH={screenH} />}

        <Pressable
          style={[styles.dismissBtn, { top: insets.top + 12 }]}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel={scorecardCopy.dismissLabel}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.dismissText}>{'✕'}</Text>
        </Pressable>

        {/* Top spacer — explicit View instead of paddingTop so the column flex
            math can't collapse it. Card centers in the middle flex region;
            runway pinned at the bottom. */}
        <View style={{ height: topPad }} />

        <View style={styles.cardArea}>
          <View style={[styles.cardWrap, { width: cardW, height: cardH }]}>
            <CardHalo width={cardW} height={cardH} />
            <Image source={{ uri: pngUri }} style={styles.cardImage} resizeMode="contain" />
          </View>
        </View>

        <Animated.View
          style={[
            styles.runway,
            {
              opacity: runwayOpacity,
              height: RUNWAY_HEIGHT,
              marginBottom: bottomPad,
            },
          ]}
        >
          <ChevronRunway width={chevronWidth} color={theme.colors.glowCyan} />
          <ShareButton width={shareTextWidth} onPress={handleShare} />
        </Animated.View>

        {showPresentationHint && (
          <View
            style={[styles.presentationHintHost, { bottom: RUNWAY_HEIGHT + bottomPad - 8 }]}
            pointerEvents="none"
          >
            <Tooltip
              message={scorecardCopy.presentationHint}
              tailDirection="down"
              tailOffset={105}
              style={styles.presentationHint}
            />
          </View>
        )}
      </SecureCaptureOverlay>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Transparent on Android so ScorecardScreen's <StarField /> shows through.
  // iOS adds an unprotected clean-card base, then covers it with this
  // screenshot-hidden presentation layer.
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  captureBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.bgVoid,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presentationLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
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
  },
  cardWrap: { alignItems: 'center', justifyContent: 'center' },
  cardImage: { width: '100%', height: '100%' },
  runway: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'flex-end',
    // No gap between chevrons stack + SHARE word; ShareButton's internal
    // paddingVertical provides the small breathing room.
  },
  presentationHintHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 40,
  },
  presentationHint: {
    width: 230,
  },
});
