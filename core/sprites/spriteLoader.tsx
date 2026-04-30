/**
 * Sprite loader — resolves a single static frame from a CEO sprite sheet.
 *
 * Each sprite sheet is a grid:
 *   - Important tier (2×2): varA neutral/defeated (row 0), varB neutral/defeated (row 1)
 *   - Standard tier  (2×1): varA neutral (col 0), defeated (col 1)
 *
 * SpriteView renders one frame by clipping the sheet with overflow:hidden
 * and offsetting the Image position. No animation — state changes via React re-render.
 */
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import {
  SPRITE_FACE_NEUTRAL_X,
  SPRITE_FACE_NEUTRAL_Y,
  SPRITE_FACE_DEFEATED_X,
  SPRITE_FACE_DEFEATED_Y,
} from '../../config/constants';
import { spriteAssets } from './spriteAssets';

// ── Manifest (bundled JSON) ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-var-requires
const manifest: SpriteManifest = require('../../assets/pixel/sprites/manifest.json');

interface SpriteFrame {
  col: number;
  row: number;
}

interface SpriteEntry {
  file: string;
  tier: 'important' | 'standard';
  grid: { cols: number; rows: number };
  frameWidth: number;
  frameHeight: number;
  frames: Record<string, SpriteFrame>;
}

interface SpriteManifest {
  sprites: Record<string, SpriteEntry>;
}

// ── Public types ─────────────────────────────────────────────────────────────

export type SpriteState = 'neutral' | 'defeated';
export type SpriteVariant = 'A' | 'B';

export interface FrameInfo {
  source: ImageSourcePropType;
  frameWidth: number;
  frameHeight: number;
  offsetX: number;
  offsetY: number;
  sheetWidth: number;
  sheetHeight: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a display name like "Jeff Bezos" to sprite ID "jeff-bezos". */
export function nameToSpriteId(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '-');
}

/**
 * Deterministic variant selection seeded by a string key.
 * djb2 hash mod 2 → 0 = A, 1 = B. Same input always produces the same variant.
 */
function pickVariant(seed: string): SpriteVariant {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash + seed.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 2) === 0 ? 'A' : 'B';
}

/** Returns true when a sprite exists for the given display name. */
export function hasSprite(figureName: string): boolean {
  return getSpriteFrame(nameToSpriteId(figureName), 'neutral') !== null;
}

// ── Core lookup ──────────────────────────────────────────────────────────────

/**
 * Look up a single sprite frame.
 *
 * @param spriteId  Kebab-case character ID (e.g. "jeff-bezos")
 * @param state     "neutral" or "defeated"
 * @param variant   Optional "A" | "B". If omitted:
 *                  - Important tier: deterministic A/B from spriteId hash
 *                  - Standard tier: always A
 * @returns FrameInfo for rendering, or null if no sprite exists.
 */
export function getSpriteFrame(
  spriteId: string,
  state: SpriteState,
  variant?: SpriteVariant,
): FrameInfo | null {
  const entry = manifest.sprites[spriteId];
  if (!entry) return null;

  const source = spriteAssets[spriteId];
  if (!source) return null;

  const resolvedVariant =
    variant ??
    (entry.tier === 'important' ? pickVariant(spriteId) : 'A');

  const frameKey = `var${resolvedVariant}_${state}`;
  const frame = entry.frames[frameKey];
  if (!frame) return null;

  return {
    source,
    frameWidth: entry.frameWidth,
    frameHeight: entry.frameHeight,
    offsetX: frame.col * entry.frameWidth,
    offsetY: frame.row * entry.frameHeight,
    sheetWidth: entry.grid.cols * entry.frameWidth,
    sheetHeight: entry.grid.rows * entry.frameHeight,
  };
}

// ── SpriteView component ─────────────────────────────────────────────────────

interface SpriteViewProps {
  /** Kebab-case sprite ID (e.g. "jeff-bezos"), or null to render nothing. */
  spriteId: string | null;
  state: SpriteState;
  variant?: SpriteVariant;
  /** Visible crop-box size in points (square). */
  size: number;
  /** Optional opacity (e.g. 0.4 for dimmed neutral). */
  opacity?: number;
  /** When true, clips to the top ~38% of the sprite frame (head/face crop). */
  headOnly?: boolean;
  /** Custom crop ratio (0-1) for top-aligned bust/portrait crops. */
  cropRatio?: number;
  /** Optional horizontal crop offset ratio of frame width. Negative reveals more left. */
  cropOffsetX?: number;
  /** Optional vertical crop offset ratio of frame height. Negative reveals more top. */
  cropOffsetY?: number;
  /**
   * Target viewport Y for the sprite's face center, fraction of viewport height
   * (0 = top, 0.5 = center, 1 = bottom). When provided, SpriteView ignores
   * cropOffsetY and computes the offset that places the face at this anchor —
   * using the SPRITE_FACE_* constants in config/constants.ts (face position is
   * the same for every sprite, post-normalization).
   */
  faceAnchorY?: number;
  /** Target viewport X for the face center. Defaults to 0.5 (centered) when
   *  faceAnchorY is provided. Ignored otherwise. */
  faceAnchorX?: number;
  /** Temporarily park the bitmap outside the clip box while hidden. */
  visible?: boolean;
}

const DEFAULT_HEAD_CROP_RATIO = 0.38;
const HIDDEN_TOP = -10000;

/**
 * Renders a single static frame from a CEO sprite sheet.
 * Shows nothing when spriteId is null or no sprite exists in the manifest.
 */
export function SpriteView({
  spriteId,
  state,
  variant,
  size,
  opacity,
  headOnly = false,
  cropRatio,
  cropOffsetX = 0,
  cropOffsetY = 0,
  faceAnchorY,
  faceAnchorX = 0.5,
  visible = true,
}: SpriteViewProps) {
  if (!spriteId) return null;

  const frame = getSpriteFrame(spriteId, state, variant);
  if (!frame) return null;

  const resolvedCropRatio = cropRatio ?? (headOnly ? DEFAULT_HEAD_CROP_RATIO : 1);

  // Face-anchor mode: derive cropOffsetX/Y from the canonical face position
  // so the face lands at (faceAnchorX, faceAnchorY) in viewport space,
  // regardless of which sprite is rendered or which state it's in.
  let resolvedCropOffsetX = cropOffsetX;
  let resolvedCropOffsetY = cropOffsetY;
  if (faceAnchorY != null) {
    const isDefeated = state === 'defeated';
    const faceX = isDefeated ? SPRITE_FACE_DEFEATED_X : SPRITE_FACE_NEUTRAL_X;
    const faceY = isDefeated ? SPRITE_FACE_DEFEATED_Y : SPRITE_FACE_NEUTRAL_Y;
    resolvedCropOffsetY = faceY - faceAnchorY * resolvedCropRatio;
    resolvedCropOffsetX =
      faceX - 0.5 + (0.5 - faceAnchorX) * resolvedCropRatio * frame.frameHeight / frame.frameWidth;
  }

  const scale = size / (frame.frameHeight * resolvedCropRatio);
  const centeredCropLeft = Math.max(0, ((frame.frameWidth * scale) - size) / 2);
  const leftCropOffset = frame.frameWidth * resolvedCropOffsetX * scale;
  const topCropOffset = frame.frameHeight * resolvedCropOffsetY * scale;

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, opacity: opacity ?? 1 },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={frame.source}
        style={{
          width: frame.sheetWidth * scale,
          height: frame.sheetHeight * scale,
          position: 'absolute' as const,
          left: -((frame.offsetX * scale) + centeredCropLeft + leftCropOffset),
          top: visible ? -((frame.offsetY * scale) + topCropOffset) : HIDDEN_TOP,
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' as const },
});
