import React, { useRef, useEffect } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import type { FXRegistration } from '../../../core/fx';
import { theme } from '../../../design/tokens';
import { ARENA_HIT_FX_MS } from '../../../config/constants';

// ── Speech bubble FX ─────────────────────────────────────────────────────────

function SpeechBubbleFX({ entry, reducedMotion, onComplete }: {
  entry: { meta?: Record<string, unknown> };
  reducedMotion: boolean;
  onComplete: () => void;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const text = (entry.meta?.text as string) ?? '!';

  useEffect(() => {
    if (reducedMotion) {
      const t = setTimeout(onComplete, ARENA_HIT_FX_MS);
      return () => clearTimeout(t);
    }
    const anim = Animated.timing(opacity, {
      toValue: 0, duration: ARENA_HIT_FX_MS, useNativeDriver: true,
    });
    anim.start(() => onComplete());
    return () => anim.stop();
  }, [reducedMotion, onComplete, opacity]);

  return (
    <Animated.View style={[styles.speechBubble, { opacity }]} pointerEvents="none" accessibilityElementsHidden>
      <Text style={styles.speechText} allowFontScaling={false}>{text}</Text>
    </Animated.View>
  );
}

// ── Floating -1 FX ───────────────────────────────────────────────────────────

function FloatingMinusOneFX({ entry, reducedMotion, onComplete }: {
  entry: { meta?: Record<string, unknown> };
  reducedMotion: boolean;
  onComplete: () => void;
}) {
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

// ── Registry ─────────────────────────────────────────────────────────────────

export const arenaFXRegistry: Record<string, FXRegistration> = {
  speechBubble: { scope: 'point', component: SpeechBubbleFX as FXRegistration['component'] },
  floatingMinus: { scope: 'area', component: FloatingMinusOneFX as FXRegistration['component'] },
};

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
