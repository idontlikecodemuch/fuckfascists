import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  ImageBackground,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { hasSprite } from '../../../core/sprites/spriteLoader';
import { arenaAssets } from '../../../core/arena/arenaAssets';
import { FXLayer, useFX } from '../../../core/fx';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import {
  ARENA_HEIGHT,
  ARENA_SAME_FIGURE_PULSE_MS,
  ARENA_TRANSITION_MS,
  ARENA_FLICKER_MIN_INTERVAL_MS,
  ARENA_FLICKER_MAX_INTERVAL_MS,
  ARENA_FLICKER_DIP_MS,
  ARENA_FLICKER_RECOVER_MS,
  ARENA_FLICKER_DIP_OPACITY,
  TRACK_ARENA_GRID_CROP_RATIO,
  TRACK_ARENA_GRID_CROP_OFFSET_X,
  TRACK_ARENA_GRID_CROP_OFFSET_Y,
  TRACK_ARENA_SINGLE_BOTTOM_INSET,
  TRACK_ARENA_SINGLE_CROP_RATIO,
  TRACK_ARENA_SINGLE_CROP_OFFSET_X,
  TRACK_ARENA_SINGLE_CROP_OFFSET_Y,
  TRACK_ARENA_SINGLE_DISPLAY_RATIO,
  TRACK_ARENA_SINGLE_LEFT_INSET,
  TRACK_GRID_SPRITE_SCALE,
} from '../../../config/constants';
import { useTrack } from '../context/TrackContext';
import { arenaFXRegistry } from './ArenaFX';
import { FigureBadge } from './FigureBadge';
import { buildGridFigures, pickRandomArena, pickReaction } from '../utils/arenaHelpers';
import { computeGridCellSize } from '../utils/platformHelpers';

export function GameArena() {
  const { arenaFocusKey, focusedFigureName, arenaHitRequest, isDefeated } = useTrack();
  const fx = useFX();
  const { width: screenWidth } = useWindowDimensions();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [measuredHeight, setMeasuredHeight] = useState(ARENA_HEIGHT);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReducedMotion(enabled);
    });
    return () => { cancelled = true; };
  }, []);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) setMeasuredHeight(h);
  }, []);

  const gridFigures = useMemo(() => buildGridFigures(), []);

  const gridCellSize = useMemo(
    () => computeGridCellSize(
      gridFigures.length,
      screenWidth,
      measuredHeight,
      theme.space.xs,
      theme.space.sm,
    ),
    [gridFigures.length, screenWidth, measuredHeight],
  );

  const gridSpriteSize = Math.round(gridCellSize * TRACK_GRID_SPRITE_SCALE);

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  // #127 — rare dip of the cyan rim highlight in the container's boxShadow.
  // State swap (not an animated opacity overlay) so the flicker rides on the
  // existing glow stack instead of adding a view layer. Boolean = "dimmed
  // this frame"; effect flips it true for DIP_MS, back to false for
  // RECOVER_MS, then schedules the next random gap.
  const [flickerDim, setFlickerDim] = useState(false);
  const [backgroundKey, setBackgroundKey] = useState<string | null>(pickRandomArena);
  const backgroundKeyRef = useRef(backgroundKey);
  backgroundKeyRef.current = backgroundKey;
  const figureArenaMapRef = useRef<Map<string, string>>(new Map());
  const currentFocusFigureRef = useRef<string | null>(focusedFigureName);
  const previousFocusRef = useRef<{ figureName: string | null; focusId: string | null }>({
    figureName: focusedFigureName,
    focusId: arenaFocusKey,
  });

  useEffect(() => {
    currentFocusFigureRef.current = focusedFigureName;
  }, [focusedFigureName]);

  useEffect(() => {
    const previous = previousFocusRef.current;
    const sameFigureDifferentTarget =
      previous.figureName !== null &&
      previous.figureName === focusedFigureName &&
      previous.focusId !== arenaFocusKey;

    if (sameFigureDifferentTarget && !reducedMotion) {
      pulseScale.setValue(1);
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.04,
          duration: Math.round(ARENA_SAME_FIGURE_PULSE_MS / 2),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1,
          duration: Math.round(ARENA_SAME_FIGURE_PULSE_MS / 2),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (previous.figureName !== focusedFigureName) {
      if (focusedFigureName) {
        const map = figureArenaMapRef.current;
        if (!map.has(focusedFigureName)) {
          map.set(focusedFigureName, pickRandomArena(backgroundKeyRef.current) ?? '');
        }
        const key = map.get(focusedFigureName) ?? null;
        setBackgroundKey(key);
      }

      if (!reducedMotion) {
        contentOpacity.setValue(0);
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: ARENA_TRANSITION_MS,
          useNativeDriver: true,
        }).start();
      }
    }

    previousFocusRef.current = {
      figureName: focusedFigureName,
      focusId: arenaFocusKey,
    };
  }, [arenaFocusKey, contentOpacity, focusedFigureName, pulseScale, reducedMotion]);

  // #127 — rare cyan-highlight flicker. Toggles flickerDim true for a brief
  // dip, then back, on a randomized schedule. Skipped entirely when Reduce
  // Motion is on; cleans up on unmount / reducedMotion flip.
  useEffect(() => {
    if (reducedMotion) {
      setFlickerDim(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleNext = () => {
      const span = ARENA_FLICKER_MAX_INTERVAL_MS - ARENA_FLICKER_MIN_INTERVAL_MS;
      const delay = ARENA_FLICKER_MIN_INTERVAL_MS + Math.random() * span;
      timer = setTimeout(() => {
        if (cancelled) return;
        setFlickerDim(true);
        timer = setTimeout(() => {
          if (cancelled) return;
          setFlickerDim(false);
          // Brief recovery gap before scheduling the next random dip,
          // so two flickers never stack back-to-back.
          timer = setTimeout(() => {
            if (!cancelled) scheduleNext();
          }, ARENA_FLICKER_RECOVER_MS);
        }, ARENA_FLICKER_DIP_MS);
      }, delay);
    };

    scheduleNext();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [reducedMotion]);

  const fireHitFX = useCallback((x = 0.34, y = 0.22) => {
    const text = pickReaction();
    fx.fire('speechBubble', 'point', { text, x, y });
    fx.fire('floatingMinus', 'area', { x: x + 0.05, y: y + 0.18 });
  }, [fx.fire]);

  useEffect(() => {
    if (!arenaHitRequest) return;

    const timer = setTimeout(() => {
      if (currentFocusFigureRef.current !== arenaHitRequest.figureName) return;
      fireHitFX();
    }, arenaHitRequest.delayMs);

    return () => clearTimeout(timer);
  }, [arenaHitRequest, fireHitFX]);

  const handleArenaTap = useCallback(() => {
    fireHitFX();
  }, [fireHitFX]);

  const handleGridTap = useCallback(() => {
    fireHitFX(0.5, 0.18);
  }, [fireHitFX]);

  const backgroundSource = backgroundKey ? arenaAssets[backgroundKey] : null;
  const singleSpriteSize = Math.round(measuredHeight * TRACK_ARENA_SINGLE_DISPLAY_RATIO);

  // Cyan rim highlight lives in the container's boxShadow stack alongside
  // the blue diffuse glow (#127). During a flicker dip we swap the rim's
  // color string for a lower-alpha cyan; rest of the stack is unchanged.
  const rimCyan = flickerDim
    ? `rgba(122, 242, 255, ${ARENA_FLICKER_DIP_OPACITY * 0.22})`
    : theme.glow.colorHighlight;

  return (
    <View
      style={[
        styles.container,
        {
          boxShadow: [
            ...styles.container.boxShadow,
            {
              offsetX: 0,
              offsetY: 0,
              blurRadius: theme.glow.highlightBlurRadius,
              spreadDistance: theme.glow.highlightSpreadDistance,
              inset: true,
              color: rimCyan,
            },
          ],
        },
      ]}
      onLayout={handleLayout}
    >
      {backgroundSource && (
        <ImageBackground
          source={backgroundSource}
          style={styles.background}
          imageStyle={styles.backgroundImage}
          resizeMode="cover"
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          <View style={styles.backgroundOverlay} />
        </ImageBackground>
      )}

      <Animated.View
        style={[styles.content, { opacity: contentOpacity, transform: [{ scale: pulseScale }] }]}
      >
        {focusedFigureName ? (
          hasSprite(focusedFigureName) ? (
            <Pressable
              onPress={handleArenaTap}
              style={styles.singleCharacter}
              accessibilityRole="button"
              accessibilityLabel={platformsCopy.arenaTapA11y(focusedFigureName)}
            >
              <FigureBadge
                figureName={focusedFigureName}
                state={isDefeated(focusedFigureName) ? 'defeated' : 'neutral'}
                size={singleSpriteSize}
                cropRatio={TRACK_ARENA_SINGLE_CROP_RATIO}
                cropOffsetX={TRACK_ARENA_SINGLE_CROP_OFFSET_X}
                cropOffsetY={TRACK_ARENA_SINGLE_CROP_OFFSET_Y}
                fallbackVariant="arena"
              />
            </Pressable>
          ) : null
        ) : (
          <View style={styles.grid}>
            {gridFigures.map((figure) => {
              const defeated = isDefeated(figure.figureName);
              return (
                <Pressable
                  key={figure.spriteId}
                  onPress={handleGridTap}
                  style={[
                    styles.gridCell,
                    { width: gridCellSize, height: gridCellSize },
                    defeated && styles.gridCellDefeated,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={platformsCopy.arenaTapA11y(figure.figureName)}
                >
                  <FigureBadge
                    figureName={figure.figureName}
                    state={defeated ? 'defeated' : 'neutral'}
                    size={gridSpriteSize}
                    cropRatio={TRACK_ARENA_GRID_CROP_RATIO}
                    cropOffsetX={TRACK_ARENA_GRID_CROP_OFFSET_X}
                    cropOffsetY={TRACK_ARENA_GRID_CROP_OFFSET_Y}
                    fallbackVariant="arena"
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </Animated.View>

      <View style={styles.fxLayer} pointerEvents="none">
        <FXLayer
          entries={fx.entries}
          registry={arenaFXRegistry}
          reducedMotion={fx.reducedMotion}
          onComplete={fx.remove}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface1,
    boxShadow: [
      { offsetX: 0, offsetY: 6, blurRadius: theme.glow.blurRadius, spreadDistance: theme.glow.spreadDistance, inset: true, color: theme.glow.color },
      { offsetX: 0, offsetY: -6, blurRadius: theme.glow.blurRadius, spreadDistance: theme.glow.spreadDistance, inset: true, color: theme.glow.color },
    ],
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.bgVoid,
  },
  backgroundImage: { opacity: 0.32 },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
    opacity: 0.28,
  },
  content: { flex: 1 },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    gap: theme.space.xs,
    padding: theme.space.sm,
  },
  gridCell: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.rewardYellow,
    backgroundColor: 'rgba(10, 11, 12, 0.65)',
    overflow: 'hidden',
    boxShadow: [
      { offsetX: 0, offsetY: 0, blurRadius: theme.glow.blurRadius, spreadDistance: theme.glow.spreadDistance, inset: true, color: theme.glow.color },
    ],
  },
  gridCellDefeated: {
    boxShadow: [
      { offsetX: 0, offsetY: 0, blurRadius: theme.glow.blurRadius, spreadDistance: theme.glow.spreadDistance, inset: true, color: theme.glow.colorDefeated },
    ],
  },
  singleCharacter: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingLeft: TRACK_ARENA_SINGLE_LEFT_INSET,
    paddingBottom: TRACK_ARENA_SINGLE_BOTTOM_INSET,
  },
  fxLayer: { ...StyleSheet.absoluteFillObject },
});
