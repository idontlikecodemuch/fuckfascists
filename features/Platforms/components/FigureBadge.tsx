import React, { useMemo } from 'react';
import { View } from 'react-native';
import {
  getSpriteFrame,
  type SpriteState,
  SpriteView,
  nameToSpriteId,
} from '../../../core/sprites/spriteLoader';

interface FigureBadgeProps {
  figureName: string;
  state: SpriteState;
  size: number;
  cropRatio?: number;
  cropOffsetX?: number;
  cropOffsetY?: number;
  fallbackVariant?: 'list' | 'arena';
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

  // No sprite available — render an empty slot (no box, no initials).
  return (
    <View
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
