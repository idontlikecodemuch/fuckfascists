import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  getSpriteFrame,
  type SpriteState,
  SpriteView,
  nameToSpriteId,
} from '../../../core/sprites/spriteLoader';
import { theme } from '../../../design/tokens';
import {
  TRACK_FIGURE_FALLBACK_BG_COLOR,
  TRACK_FIGURE_FALLBACK_BORDER_COLOR,
  TRACK_FIGURE_FALLBACK_TEXT_COLOR,
} from '../../../config/constants';

interface FigureBadgeProps {
  figureName: string;
  state: SpriteState;
  size: number;
  cropRatio?: number;
  cropOffsetX?: number;
  cropOffsetY?: number;
  fallbackVariant?: 'list' | 'arena';
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

export function FigureBadge({
  figureName,
  state,
  size,
  cropRatio,
  cropOffsetX,
  cropOffsetY,
  fallbackVariant = 'list',
}: FigureBadgeProps) {
  const spriteId = nameToSpriteId(figureName);
  const resolvedState = useMemo<SpriteState | null>(() => {
    if (getSpriteFrame(spriteId, state)) return state;
    if (getSpriteFrame(spriteId, 'neutral')) return 'neutral';
    return null;
  }, [spriteId, state]);

  if (resolvedState) {
    return (
      <SpriteView
        spriteId={spriteId}
        state={resolvedState}
        size={size}
        cropRatio={cropRatio}
        cropOffsetX={cropOffsetX}
        cropOffsetY={cropOffsetY}
      />
    );
  }

  const initials = getInitials(figureName);
  const textSize = Math.max(10, Math.min(36, Math.round(size * 0.28)));

  return (
    <View
      style={[
        styles.fallback,
        fallbackVariant === 'arena' ? styles.arenaFallback : styles.listFallback,
        { width: size, height: size },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text
        style={[
          styles.fallbackText,
          fallbackVariant === 'arena' ? styles.arenaFallbackText : styles.listFallbackText,
          { fontSize: textSize },
        ]}
        allowFontScaling={false}
      >
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  listFallback: {
    backgroundColor: TRACK_FIGURE_FALLBACK_BG_COLOR,
    borderWidth: theme.borders.standard.width,
    borderColor: TRACK_FIGURE_FALLBACK_BORDER_COLOR,
  },
  arenaFallback: {
    backgroundColor: 'rgba(7, 11, 18, 0.28)',
  },
  fallbackText: {
    fontFamily: theme.fonts.bodySemiBold,
    color: TRACK_FIGURE_FALLBACK_TEXT_COLOR,
    letterSpacing: 0.4,
  },
  listFallbackText: {
    fontFamily: theme.fonts.bodySemiBold,
  },
  arenaFallbackText: {
    fontFamily: theme.fonts.headline,
    color: theme.colors.rewardYellow,
  },
});
