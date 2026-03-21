import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, ImageBackground, Pressable, StyleSheet, View } from 'react-native';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { arenaAssets } from '../../../core/arena/arenaAssets';
import { FXLayer, useFX } from '../../../core/fx';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import {
  ARENA_HEIGHT,
  ARENA_SAME_FIGURE_PULSE_MS,
  ARENA_TRANSITION_MS,
  TRACK_ARENA_GRID_CELL_SIZE,
  TRACK_ARENA_GRID_CROP_RATIO,
  TRACK_ARENA_GRID_CROP_OFFSET_Y,
  TRACK_ARENA_SINGLE_BOTTOM_INSET,
  TRACK_ARENA_SINGLE_CROP_RATIO,
  TRACK_ARENA_SINGLE_CROP_OFFSET_Y,
  TRACK_ARENA_SINGLE_DISPLAY_RATIO,
  TRACK_ARENA_SINGLE_LEFT_INSET,
} from '../../../config/constants';
import { TRACKED_PLATFORMS } from '../data/platformList';
import { getDisplayFigure, useTrack } from '../context/TrackContext';
import { arenaFXRegistry } from './ArenaFX';

interface ArenaFigure {
  figureName: string;
  spriteId: string;
}

const arenaKeys = Object.keys(arenaAssets);

function pickRandomArena(): string | null {
  if (arenaKeys.length === 0) return null;
  return arenaKeys[Math.floor(Math.random() * arenaKeys.length)] ?? null;
}

function pickReaction(): string {
  const reactions = platformsCopy.spriteReactions;
  return reactions[Math.floor(Math.random() * reactions.length)] ?? reactions[0] ?? '!';
}

export function GameArena() {
  const { focusedFigureName, focusedPlatformId, arenaHitRequest, todayActions } = useTrack();
  const fx = useFX();

  const gridFigures = useMemo<ArenaFigure[]>(() => {
    const seen = new Set<string>();
    const figures: ArenaFigure[] = [];

    for (const platform of TRACKED_PLATFORMS) {
      const figureName = getDisplayFigure(platform);
      if (seen.has(figureName)) continue;
      seen.add(figureName);
      figures.push({ figureName, spriteId: nameToSpriteId(figureName) });
    }

    return figures;
  }, []);

  const contentOpacity = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const backgroundKeyRef = useRef<string | null>(pickRandomArena());
  const currentFocusFigureRef = useRef<string | null>(focusedFigureName);
  const previousFocusRef = useRef<{ figureName: string | null; focusId: string | null }>({
    figureName: focusedFigureName,
    focusId: focusedPlatformId,
  });

  useEffect(() => {
    currentFocusFigureRef.current = focusedFigureName;
  }, [focusedFigureName]);

  useEffect(() => {
    const previous = previousFocusRef.current;
    const sameFigureDifferentTarget =
      previous.figureName !== null &&
      previous.figureName === focusedFigureName &&
      previous.focusId !== focusedPlatformId;

    if (sameFigureDifferentTarget) {
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
      contentOpacity.setValue(0);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: ARENA_TRANSITION_MS,
        useNativeDriver: true,
      }).start();
    }

    previousFocusRef.current = {
      figureName: focusedFigureName,
      focusId: focusedPlatformId,
    };
  }, [contentOpacity, focusedFigureName, focusedPlatformId, pulseScale]);

  const fireHitFX = useCallback((x = 0.34, y = 0.22) => {
    const text = pickReaction();
    fx.fire('speechBubble', 'point', { text, x, y });
    fx.fire('floatingMinus', 'area', { x: x + 0.05, y: y + 0.18 });
  }, [fx]);

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

  const backgroundSource = backgroundKeyRef.current ? arenaAssets[backgroundKeyRef.current] : null;
  const singleSpriteSize = Math.round(ARENA_HEIGHT * TRACK_ARENA_SINGLE_DISPLAY_RATIO);

  return (
    <View style={styles.container}>
      {backgroundSource && (
        <ImageBackground source={backgroundSource} style={styles.background} resizeMode="stretch" />
      )}
      <View style={styles.backgroundOverlay} />

      <Animated.View
        style={[styles.content, { opacity: contentOpacity, transform: [{ scale: pulseScale }] }]}
      >
        {focusedFigureName ? (
          <Pressable
            onPress={handleArenaTap}
            style={styles.singleCharacter}
            accessibilityRole="button"
            accessibilityLabel={platformsCopy.arenaTapA11y(focusedFigureName)}
          >
            <SpriteView
              spriteId={nameToSpriteId(focusedFigureName)}
              state={todayActions.has(focusedFigureName) ? 'defeated' : 'neutral'}
              size={singleSpriteSize}
              cropRatio={TRACK_ARENA_SINGLE_CROP_RATIO}
              cropOffsetY={TRACK_ARENA_SINGLE_CROP_OFFSET_Y}
            />
          </Pressable>
        ) : (
          <View style={styles.grid}>
            {gridFigures.map((figure) => (
              <Pressable
                key={figure.spriteId}
                onPress={handleGridTap}
                style={styles.gridCell}
                accessibilityRole="button"
                accessibilityLabel={platformsCopy.arenaTapA11y(figure.figureName)}
              >
                <SpriteView
                  spriteId={figure.spriteId}
                  state="neutral"
                  size={TRACK_ARENA_GRID_CELL_SIZE}
                  cropRatio={TRACK_ARENA_GRID_CROP_RATIO}
                  cropOffsetY={TRACK_ARENA_GRID_CROP_OFFSET_Y}
                />
              </Pressable>
            ))}
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
    height: ARENA_HEIGHT,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface1,
    borderBottomWidth: theme.borders.hero.width,
    borderBottomColor: theme.colors.frameBlue,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.32,
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.bgVoid,
    opacity: 0.28,
  },
  content: {
    flex: 1,
  },
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
    width: TRACK_ARENA_GRID_CELL_SIZE,
    height: TRACK_ARENA_GRID_CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.rewardYellow,
    backgroundColor: theme.colors.surface2,
    overflow: 'hidden',
  },
  singleCharacter: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingLeft: TRACK_ARENA_SINGLE_LEFT_INSET,
    paddingBottom: TRACK_ARENA_SINGLE_BOTTOM_INSET,
  },
  fxLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});
