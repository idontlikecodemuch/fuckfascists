import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, Animated, AccessibilityInfo, StyleSheet } from 'react-native';
import { SpriteView } from '../../../core/sprites/spriteLoader';
import { platformsCopy } from '../../../copy/platforms';
import { theme } from '../../../design/tokens';

const SPRITE_SIZE = 48;
const DEFEATED_THRESHOLD = 3;
const FX_DURATION = 600;
const BUBBLE_DURATION = 1000;

interface ArenaFigure {
  name: string;
  spriteId: string;
  totalAvoids: number;
}

interface GameArenaProps {
  /** All figures to show, deduped by display name. */
  figures: ArenaFigure[];
  /** Newly avoided figure name — triggers the floating -1 FX. */
  lastAvoided: string | null;
}

interface TapFx {
  fadeAnim: Animated.Value;
  translateAnim: Animated.Value;
  bubbleFadeAnim: Animated.Value;
  reaction: string;
  active: boolean;
}

function pickReaction(): string {
  const reactions = platformsCopy.spriteReactions;
  return reactions[Math.floor(Math.random() * reactions.length)];
}

/**
 * Static sprite grid at the top of the Platforms screen.
 * Shows all tracked figures as bust sprites in a wrapping grid.
 *
 * Two FX triggers:
 * 1. Avoid-triggered: `lastAvoided` prop fires floating -1 on the matching sprite.
 * 2. Tap-triggered: tapping any sprite shows a cosmetic -1 + speech bubble reaction.
 *    No data is logged — purely decorative.
 */
export function GameArena({ figures, lastAvoided }: GameArenaProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  // Avoid-triggered FX (from PlatformsScreen handleAvoid)
  const [avoidFxTarget, setAvoidFxTarget] = useState<string | null>(null);
  const avoidFade = useRef(new Animated.Value(0)).current;
  const avoidTranslate = useRef(new Animated.Value(0)).current;

  // Tap-triggered FX — keyed by figure name
  const tapFxRef = useRef(new Map<string, TapFx>()).current;
  const [tapFxVersion, setTapFxVersion] = useState(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
  }, []);

  // Avoid-triggered -1 animation
  useEffect(() => {
    if (!lastAvoided || reducedMotion) return;
    setAvoidFxTarget(lastAvoided);
    avoidFade.setValue(1);
    avoidTranslate.setValue(0);
    Animated.parallel([
      Animated.timing(avoidFade, { toValue: 0, duration: FX_DURATION, useNativeDriver: true }),
      Animated.timing(avoidTranslate, { toValue: -24, duration: FX_DURATION, useNativeDriver: true }),
    ]).start(() => setAvoidFxTarget(null));
  }, [lastAvoided, reducedMotion, avoidFade, avoidTranslate]);

  const getTapFx = useCallback((name: string): TapFx => {
    let fx = tapFxRef.get(name);
    if (!fx) {
      fx = {
        fadeAnim: new Animated.Value(0),
        translateAnim: new Animated.Value(0),
        bubbleFadeAnim: new Animated.Value(0),
        reaction: '',
        active: false,
      };
      tapFxRef.set(name, fx);
    }
    return fx;
  }, [tapFxRef]);

  const handleSpriteTap = useCallback((name: string) => {
    const fx = getTapFx(name);
    fx.reaction = pickReaction();
    fx.active = true;
    setTapFxVersion((v) => v + 1);

    if (reducedMotion) {
      // Static: show bubble for 1s, then hide
      fx.bubbleFadeAnim.setValue(1);
      fx.fadeAnim.setValue(0);
      const timer = setTimeout(() => {
        fx.bubbleFadeAnim.setValue(0);
        fx.active = false;
        setTapFxVersion((v) => v + 1);
      }, BUBBLE_DURATION);
      return () => clearTimeout(timer);
    }

    // Animated: -1 floats up + speech bubble fades in then out
    fx.fadeAnim.setValue(1);
    fx.translateAnim.setValue(0);
    fx.bubbleFadeAnim.setValue(1);

    Animated.parallel([
      Animated.timing(fx.fadeAnim, { toValue: 0, duration: FX_DURATION, useNativeDriver: true }),
      Animated.timing(fx.translateAnim, { toValue: -24, duration: FX_DURATION, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(BUBBLE_DURATION),
      Animated.timing(fx.bubbleFadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      fx.active = false;
      setTapFxVersion((v) => v + 1);
    });
  }, [reducedMotion, getTapFx]);

  return (
    <View style={styles.arena}>
      <Text style={styles.title} accessibilityRole="header" allowFontScaling={false}>
        {platformsCopy.arenaTitle}
      </Text>
      <View style={styles.grid}>
        {figures.map((fig) => {
          const isDefeated = fig.totalAvoids >= DEFEATED_THRESHOLD;
          const opacity = fig.totalAvoids > 0 ? 1 : 0.4;
          const tapFx = tapFxRef.get(fig.name);
          const showTapFx = tapFx?.active === true;
          const showAvoidFx = avoidFxTarget === fig.name;

          return (
            <Pressable
              key={fig.name}
              style={styles.cell}
              onPress={() => handleSpriteTap(fig.name)}
              accessibilityLabel={fig.name}
              accessibilityRole="button"
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <SpriteView
                spriteId={fig.spriteId}
                state={isDefeated ? 'defeated' : 'neutral'}
                size={SPRITE_SIZE}
                opacity={opacity}
              />

              {/* Avoid-triggered -1 */}
              {showAvoidFx && (
                <Animated.Text
                  style={[
                    styles.fxText,
                    { opacity: avoidFade, transform: [{ translateY: avoidTranslate }] },
                  ]}
                  accessibilityElementsHidden
                >
                  -1
                </Animated.Text>
              )}

              {/* Tap-triggered -1 */}
              {showTapFx && !reducedMotion && (
                <Animated.Text
                  style={[
                    styles.fxText,
                    { opacity: tapFx!.fadeAnim, transform: [{ translateY: tapFx!.translateAnim }] },
                  ]}
                  accessibilityElementsHidden
                >
                  -1
                </Animated.Text>
              )}

              {/* Speech bubble */}
              {showTapFx && (
                <Animated.View
                  style={[styles.bubble, { opacity: tapFx!.bubbleFadeAnim }]}
                  accessibilityElementsHidden
                >
                  <Text style={styles.bubbleText} allowFontScaling={false}>
                    {tapFx!.reaction}
                  </Text>
                </Animated.View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  arena: {
    backgroundColor: theme.colors.surface2,
    borderWidth: theme.borders.hero.width,
    borderColor: theme.colors.frameBlue,
    borderTopColor: theme.colors.highlightBlue,
    borderBottomColor: theme.colors.bgVoid,
    margin: theme.space.md,
    padding: theme.space.md,
  },
  title: {
    ...theme.type.displayS,
    fontSize: 10,
    color: theme.colors.rewardYellow,
    letterSpacing: 3,
    marginBottom: theme.space.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.space.sm,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
  },
  fxText: {
    position: 'absolute',
    top: -4,
    ...theme.type.displayS,
    fontSize: 14,
    color: theme.colors.dangerRed,
  },
  bubble: {
    position: 'absolute',
    top: -18,
    backgroundColor: theme.colors.surface1,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.frameBlue,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  bubbleText: {
    ...theme.type.caption,
    fontSize: 9,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
});
