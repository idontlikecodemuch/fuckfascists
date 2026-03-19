import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import {
  View, Pressable, Text, Animated, StyleSheet, useWindowDimensions,
  AccessibilityInfo, Image,
} from 'react-native';
import { SpriteView, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import { arenaAssets } from '../../../core/arena/arenaAssets';
import { useTrack, getDisplayFigure } from '../context/TrackContext';
import { useFX, FXLayer } from '../../../core/fx';
import type { FXRegistration } from '../../../core/fx';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';
import {
  ARENA_MAX_HEIGHT,
  ARENA_TRANSITION_MS,
  ARENA_HIT_FX_MS,
} from '../../../config/constants';

// ── Arena-scoped FX: speech bubble + floating -1 ─────────────────────────────

function SpeechBubbleFX({ entry, reducedMotion, onComplete }: { entry: { meta?: Record<string, unknown> }; reducedMotion: boolean; onComplete: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const text = (entry.meta?.text as string) ?? '!';

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(onComplete, ARENA_HIT_FX_MS);
      return () => clearTimeout(t);
    }
    const anim = Animated.timing(opacity, { toValue: 0, duration: ARENA_HIT_FX_MS, useNativeDriver: true });
    anim.start(() => onComplete());
    return () => anim.stop();
  }, [reducedMotion, onComplete, opacity]);

  return (
    <Animated.View style={[styles.speechBubble, { opacity }]} pointerEvents="none" accessibilityElementsHidden>
      <Text style={styles.speechText} allowFontScaling={false}>{text}</Text>
    </Animated.View>
  );
}

function FloatingMinusOneFX({ entry, reducedMotion, onComplete }: { entry: { meta?: Record<string, unknown> }; reducedMotion: boolean; onComplete: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(onComplete, ARENA_HIT_FX_MS);
      return () => clearTimeout(t);
    }
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: ARENA_HIT_FX_MS, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -40, duration: ARENA_HIT_FX_MS, useNativeDriver: true }),
    ]);
    anim.start(() => onComplete());
    return () => anim.stop();
  }, [reducedMotion, onComplete, opacity, translateY]);

  return (
    <Animated.View
      style={[styles.floatingMinus, { opacity, transform: [{ translateY }] }]}
      pointerEvents="none"
      accessibilityElementsHidden
    >
      <Text style={styles.floatingMinusText} allowFontScaling={false}>-1</Text>
    </Animated.View>
  );
}

const arenaFXRegistry: Record<string, FXRegistration> = {
  speechBubble: { scope: 'point', component: SpeechBubbleFX as FXRegistration['component'] },
  floatingMinus: { scope: 'area', component: FloatingMinusOneFX as FXRegistration['component'] },
};

// ── Arena backgrounds ────────────────────────────────────────────────────────

const arenaKeys = Object.keys(arenaAssets);
function pickArena(seed: string): string {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
  return arenaKeys[Math.abs(hash) % arenaKeys.length]!;
}

// ── Unique figure list ───────────────────────────────────────────────────────

interface ArenaFigure {
  name: string;
  spriteId: string;
}

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Arena container with three states:
 *   1. Grid view (focusedPlatformId === null) — all figures as headOnly busts
 *   2. Single neutral (focused, not in todayActions)
 *   3. Single defeated (focused, in todayActions)
 */
export function GameArena() {
  const { width } = useWindowDimensions();
  const arenaHeight = Math.min(Math.round((width * 9) / 16), ARENA_MAX_HEIGHT);
  const { focusedPlatformId, todayActions, platforms, personWeeklyAvoids, isDefeated } = useTrack();
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

    // Skip transition for sibling switches (same person, different platform)
    if (currentFigure === prevFigure) return;

    prevFigureRef.current = currentFigure;
    transitionOpacity.setValue(0);
    Animated.timing(transitionOpacity, {
      toValue: 1,
      duration: ARENA_TRANSITION_MS,
      useNativeDriver: true,
    }).start();
  }, [focusedFigure?.name, transitionOpacity]);

  // Arena background (deterministic)
  const bgKey = pickArena(focusedFigure?.name ?? 'grid');
  const bgSource = arenaAssets[bgKey];

  // Cosmetic sprite tap handler (grid view only)
  const handleSpriteTap = useCallback((figure: ArenaFigure) => {
    const reactions = platformsCopy.spriteReactions;
    const text = reactions[Math.floor(Math.random() * reactions.length)];
    fx.fire('speechBubble', 'point', { text });
    fx.fire('floatingMinus', 'area', {});
  }, [fx]);

  /** Fire hit FX — called by TrackScreen after avoid tap via ref. */
  const fireHitFX = useCallback(() => {
    fx.fire('floatingMinus', 'area', {});
    const reactions = platformsCopy.spriteReactions;
    const text = reactions[Math.floor(Math.random() * reactions.length)];
    fx.fire('speechBubble', 'point', { text });
  }, [fx]);

  // Expose fireHitFX to parent via a stable function on the component
  // (TrackScreen will call this after avoid)
  GameArena.fireHitFX = fireHitFX;

  return (
    <View style={[styles.container, { height: arenaHeight }]}>
      {bgSource && (
        <Image source={bgSource} style={styles.bg} resizeMode="cover" />
      )}
      <View style={styles.overlay} />

      <Animated.View style={[styles.content, { opacity: transitionOpacity }]}>
        {focusedFigure ? (
          <SingleSprite
            figure={focusedFigure}
            defeated={todayActions.has(focusedFigure.name)}
            weeklyAvoids={personWeeklyAvoids(focusedFigure.name)}
            arenaHeight={arenaHeight}
          />
        ) : (
          <SpriteGrid figures={figures} onTap={handleSpriteTap} />
        )}
      </Animated.View>

      <FXLayer
        entries={fx.entries}
        registry={arenaFXRegistry}
        reducedMotion={fx.reducedMotion}
        onComplete={fx.remove}
      />
    </View>
  );
}

// Static property for parent communication
GameArena.fireHitFX = (() => {}) as () => void;

// ── Sub-components ───────────────────────────────────────────────────────────

function SpriteGrid({ figures, onTap }: { figures: ArenaFigure[]; onTap: (f: ArenaFigure) => void }) {
  const { isDefeated, personWeeklyAvoids } = useTrack();

  return (
    <View style={styles.grid}>
      {figures.map((fig) => {
        const defeated = isDefeated(fig.name);
        const avoids = personWeeklyAvoids(fig.name);
        return (
          <Pressable
            key={fig.spriteId}
            onPress={() => onTap(fig)}
            style={styles.gridCell}
            accessibilityRole="button"
            accessibilityLabel={platformsCopy.arenaTapA11y(fig.name)}
          >
            <SpriteView
              spriteId={fig.spriteId}
              state={defeated ? 'defeated' : 'neutral'}
              size={48}
              headOnly
              opacity={avoids > 0 ? 1 : 0.4}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function SingleSprite({
  figure,
  defeated,
  weeklyAvoids,
  arenaHeight,
}: {
  figure: ArenaFigure;
  defeated: boolean;
  weeklyAvoids: number;
  arenaHeight: number;
}) {
  const spriteSize = Math.round(arenaHeight * 0.75);

  return (
    <View style={styles.singleContainer}>
      <SpriteView
        spriteId={figure.spriteId}
        state={defeated ? 'defeated' : 'neutral'}
        size={spriteSize}
        opacity={weeklyAvoids > 0 ? 1 : 0.6}
      />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
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
    gap: theme.space.sm,
    padding: theme.space.sm,
  },
  gridCell: {
    width: 56,
    height: 56,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.rewardYellow,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speechBubble: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    backgroundColor: theme.colors.textPrimary,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xs,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.bgVoid,
    zIndex: 10,
  },
  speechText: {
    ...theme.type.uiLabel,
    color: theme.colors.bgVoid,
    textTransform: 'uppercase',
  },
  floatingMinus: {
    position: 'absolute',
    top: '30%',
    alignSelf: 'center',
    zIndex: 10,
  },
  floatingMinusText: {
    ...theme.type.displayM,
    color: theme.colors.dangerRed,
    fontWeight: 'bold',
  },
});
