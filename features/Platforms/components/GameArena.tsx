import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View, Pressable, Animated, StyleSheet, Image,
} from 'react-native';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { arenaAssets } from '../../../core/arena/arenaAssets';
import { useTrack, getDisplayFigure } from '../context/TrackContext';
import { useFX, FXLayer } from '../../../core/fx';
import { arenaFXRegistry } from './ArenaFX';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import {
  ARENA_HEIGHT,
  ARENA_TRANSITION_MS,
  TRACK_ARENA_GRID_CELL_SIZE,
} from '../../../config/constants';

// ── Arena backgrounds ────────────────────────────────────────────────────────

const arenaKeys = Object.keys(arenaAssets);
function pickArena(seed: string): string {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
  return arenaKeys[Math.abs(hash) % arenaKeys.length]!;
}

interface ArenaFigure {
  name: string;
  spriteId: string;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Arena container with three visual states:
 *   1. Grid view (focusedPlatformId === null) — all figures as headOnly busts, ALWAYS neutral
 *   2. Single neutral (focused, not in todayActions)
 *   3. Single defeated (focused, in todayActions)
 */
export function GameArena() {
  const {
    focusedPlatformId, todayActions, platforms, personWeeklyAvoids,
  } = useTrack();
  const fx = useFX();

  // Dedupe figures by display name
  const figures = useMemo<ArenaFigure[]>(() => {
    const seen = new Set<string>();
    const result: ArenaFigure[] = [];
    for (const p of platforms) {
      const name = getDisplayFigure(p);
      if (!seen.has(name)) {
        seen.add(name);
        result.push({ name, spriteId: nameToSpriteId(name) });
      }
    }
    return result;
  }, [platforms]);

  // Resolve focused figure
  const focusedFigure = useMemo<ArenaFigure | null>(() => {
    if (!focusedPlatformId) return null;
    const platform = platforms.find((p) => p.id === focusedPlatformId);
    if (!platform) return null;
    const name = getDisplayFigure(platform);
    return { name, spriteId: nameToSpriteId(name) };
  }, [focusedPlatformId, platforms]);

  // Arena transition opacity
  const transitionOpacity = useRef(new Animated.Value(1)).current;
  const prevFigureRef = useRef<string | null>(null);

  useEffect(() => {
    const currentFigure = focusedFigure?.name ?? null;
    const prevFigure = prevFigureRef.current;
    if (currentFigure === prevFigure) return;
    prevFigureRef.current = currentFigure;
    transitionOpacity.setValue(0);
    Animated.timing(transitionOpacity, {
      toValue: 1, duration: ARENA_TRANSITION_MS, useNativeDriver: true,
    }).start();
  }, [focusedFigure?.name, transitionOpacity]);

  // Background (deterministic, stable across focus changes for session)
  const bgKeyRef = useRef(pickArena('grid'));
  const bgSource = arenaAssets[bgKeyRef.current];

  // Cosmetic sprite tap handler
  const handleSpriteTap = useCallback(() => {
    const reactions = platformsCopy.spriteReactions;
    const text = reactions[Math.floor(Math.random() * reactions.length)];
    fx.fire('speechBubble', 'point', { text });
    fx.fire('floatingMinus', 'area', {});
  }, [fx]);

  // Expose fireHitFX for parent communication
  const fireHitFX = useCallback(() => {
    const reactions = platformsCopy.spriteReactions;
    const text = reactions[Math.floor(Math.random() * reactions.length)];
    fx.fire('speechBubble', 'point', { text });
    fx.fire('floatingMinus', 'area', {});
  }, [fx]);
  GameArena.fireHitFX = fireHitFX;

  return (
    <View style={styles.container}>
      {bgSource && (
        <Image source={bgSource} style={styles.bg} resizeMode="cover" />
      )}
      <View style={styles.overlay} />

      <Animated.View style={[styles.content, { opacity: transitionOpacity }]}>
        {focusedFigure ? (
          <Pressable
            onPress={handleSpriteTap}
            style={styles.singleContainer}
            accessibilityRole="button"
            accessibilityLabel={platformsCopy.arenaTapA11y(focusedFigure.name)}
          >
            <SpriteView
              spriteId={focusedFigure.spriteId}
              state={todayActions.has(focusedFigure.name) ? 'defeated' : 'neutral'}
              size={Math.round(ARENA_HEIGHT * 0.7)}
              opacity={personWeeklyAvoids(focusedFigure.name) > 0 ? 1 : 0.6}
            />
          </Pressable>
        ) : (
          <View style={styles.grid}>
            {figures.map((fig) => (
              <View key={fig.spriteId} style={styles.gridCell}>
                <SpriteView
                  spriteId={fig.spriteId}
                  state="neutral"
                  size={Math.round(TRACK_ARENA_GRID_CELL_SIZE / 0.38)}
                  headOnly
                  opacity={personWeeklyAvoids(fig.name) > 0 ? 1 : 0.5}
                />
              </View>
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

GameArena.fireHitFX = (() => {}) as () => void;

const styles = StyleSheet.create({
  container: {
    height: ARENA_HEIGHT,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface1,
    borderBottomWidth: theme.borders.hero.width,
    borderBottomColor: theme.colors.frameBlue,
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.bgVoid,
    opacity: 0.4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.space.xs,
    padding: theme.space.sm,
  },
  gridCell: {
    width: TRACK_ARENA_GRID_CELL_SIZE,
    height: TRACK_ARENA_GRID_CELL_SIZE,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.rewardYellow,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  singleContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: theme.space.sm,
  },
  fxLayer: {
    ...StyleSheet.absoluteFillObject,
  },
});
