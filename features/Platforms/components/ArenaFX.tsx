import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import type { FXComponentProps, FXRegistration } from '../../../core/fx';
import { theme } from '../../../design/tokens';
import { ARENA_HIT_FX_MS } from '../../../config/constants';

interface ArenaFXMeta {
  text?: string;
  x?: number;
  y?: number;
}

function readMeta(entry: FXComponentProps['entry'], fallbackX: number, fallbackY: number) {
  const meta = (entry.meta ?? {}) as ArenaFXMeta;
  const left = `${Math.round((meta.x ?? fallbackX) * 100)}%` as `${number}%`;
  const top = `${Math.round((meta.y ?? fallbackY) * 100)}%` as `${number}%`;
  return {
    text: meta.text ?? '!',
    left,
    top,
  };
}

function SpeechBubbleFX({ entry, reducedMotion, onComplete }: FXComponentProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const { left, text, top } = useMemo(() => readMeta(entry, 0.34, 0.2), [entry]);

  useEffect(() => {
    if (reducedMotion) {
      const timer = setTimeout(onComplete, ARENA_HIT_FX_MS);
      return () => clearTimeout(timer);
    }

    const animation = Animated.timing(opacity, {
      toValue: 0,
      duration: ARENA_HIT_FX_MS,
      useNativeDriver: true,
    });
    animation.start(() => onComplete());
    return () => animation.stop();
  }, [onComplete, opacity, reducedMotion]);

  return (
    <Animated.View
      style={[styles.speechBubble, { left, opacity, top }]}
      pointerEvents="none"
      accessibilityElementsHidden
    >
      <Text style={styles.speechText} allowFontScaling={false}>
        {text}
      </Text>
    </Animated.View>
  );
}

function FloatingMinusOneFX({ entry, reducedMotion, onComplete }: FXComponentProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const { left, top } = useMemo(() => readMeta(entry, 0.38, 0.38), [entry]);

  useEffect(() => {
    if (reducedMotion) {
      const timer = setTimeout(onComplete, ARENA_HIT_FX_MS);
      return () => clearTimeout(timer);
    }

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: ARENA_HIT_FX_MS,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -36,
        duration: ARENA_HIT_FX_MS,
        useNativeDriver: true,
      }),
    ]);
    animation.start(() => onComplete());
    return () => animation.stop();
  }, [onComplete, opacity, reducedMotion, translateY]);

  return (
    <Animated.View
      style={[
        styles.floatingMinus,
        { left, opacity, top, transform: [{ translateX: -12 }, { translateY }] },
      ]}
      pointerEvents="none"
      accessibilityElementsHidden
    >
      <Text style={styles.floatingMinusText} allowFontScaling={false}>
        -1
      </Text>
    </Animated.View>
  );
}

export const arenaFXRegistry: Record<string, FXRegistration> = {
  speechBubble: { scope: 'point', component: SpeechBubbleFX },
  floatingMinus: { scope: 'area', component: FloatingMinusOneFX },
};

const styles = StyleSheet.create({
  speechBubble: {
    position: 'absolute',
    maxWidth: 120,
    paddingHorizontal: theme.space.sm,
    paddingVertical: theme.space.xs,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.frameBlue,
    backgroundColor: theme.colors.surface1,
    transform: [{ translateX: -36 }],
  },
  speechText: {
    ...theme.type.caption,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bodySemiBold,
    textTransform: 'uppercase',
  },
  floatingMinus: {
    position: 'absolute',
  },
  floatingMinusText: {
    ...theme.type.displayS,
    color: theme.colors.dangerRed,
  },
});
