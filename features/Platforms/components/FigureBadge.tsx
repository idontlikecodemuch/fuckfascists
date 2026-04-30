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
  /** Forwarded to SpriteView — when set, face is anchored at this viewport Y
   *  and cropOffsetY is computed dynamically by state. */
  faceAnchorY?: number;
  /** Forwarded to SpriteView. Defaults to 0.5 inside SpriteView. */
  faceAnchorX?: number;
  fallbackVariant?: 'list' | 'arena';
}

export function FigureBadge({
  figureName,
  state,
  size,
  cropRatio,
  cropOffsetX,
  cropOffsetY,
  faceAnchorY,
  faceAnchorX,
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
        faceAnchorX={faceAnchorX}
        faceAnchorY={faceAnchorY}
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
