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
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import type { ImageSourcePropType, LayoutChangeEvent } from 'react-native';
// expo-image uses SDWebImage on iOS — a different native class from RN's
// RCTImageView, so it bypasses Fabric's view-recycling pool. That pool is the
// root cause of the "top-of-head only" clipping on repeat sprite mounts under
// load (many FlagMarker Images on the map + repeated card opens). RN 0.76 +
// new arch regression class: see facebook/react-native#48392 (overflow:hidden
// re-render clip) and related.
import { Image } from 'expo-image';
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
}

const DEFAULT_HEAD_CROP_RATIO = 0.38;

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
}: SpriteViewProps) {
  // [SPRITE-DBG] Hooks declared unconditionally before early-return branches.
  // Logs gated on __DEV__.
  const renderCountRef = useRef(0);
  useEffect(() => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.log(`[SPRITE-DBG] SpriteView MOUNT id=${spriteId} state=${state} size=${size}`);
    }
    return () => {
      if (__DEV__) {
        // eslint-disable-next-line no-console
        console.log(`[SPRITE-DBG] SpriteView UNMOUNT id=${spriteId}`);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!spriteId) return null;

  const frame = getSpriteFrame(spriteId, state, variant);
  if (!frame) return null;

  const resolvedCropRatio = cropRatio ?? (headOnly ? DEFAULT_HEAD_CROP_RATIO : 1);
  const scale = size / (frame.frameHeight * resolvedCropRatio);
  const centeredCropLeft = Math.max(0, ((frame.frameWidth * scale) - size) / 2);
  const leftCropOffset = frame.frameWidth * cropOffsetX * scale;
  const topCropOffset = frame.frameHeight * cropOffsetY * scale;

  const imgWidth = frame.sheetWidth * scale;
  const imgHeight = frame.sheetHeight * scale;
  const imgLeft = -((frame.offsetX * scale) + centeredCropLeft + leftCropOffset);
  const imgTop = -((frame.offsetY * scale) + topCropOffset);

  if (__DEV__) {
    renderCountRef.current += 1;
    // eslint-disable-next-line no-console
    console.log(
      `[SPRITE-DBG] SpriteView RENDER #${renderCountRef.current} id=${spriteId} state=${state} size=${size} ` +
      `scale=${scale.toFixed(3)} frameWH=${frame.frameWidth}x${frame.frameHeight} ` +
      `sheetWH=${frame.sheetWidth}x${frame.sheetHeight} offsetXY=${frame.offsetX},${frame.offsetY} ` +
      `imgWH=${imgWidth.toFixed(1)}x${imgHeight.toFixed(1)} imgLT=${imgLeft.toFixed(1)},${imgTop.toFixed(1)}`,
    );
  }

  const onContainerLayout = (e: LayoutChangeEvent) => {
    if (__DEV__) {
      const { width, height, x, y } = e.nativeEvent.layout;
      // eslint-disable-next-line no-console
      console.log(
        `[SPRITE-DBG] SpriteView container onLayout id=${spriteId} measured=${width.toFixed(1)}x${height.toFixed(1)} ` +
        `xy=${x.toFixed(1)},${y.toFixed(1)} expected=${size}x${size}` +
        (width !== size || height !== size ? ' !!! SIZE MISMATCH' : ''),
      );
    }
  };

  const onImageLayout = (e: LayoutChangeEvent) => {
    if (__DEV__) {
      const { width, height, x, y } = e.nativeEvent.layout;
      // eslint-disable-next-line no-console
      console.log(
        `[SPRITE-DBG] SpriteView image onLayout id=${spriteId} measured=${width.toFixed(1)}x${height.toFixed(1)} ` +
        `xy=${x.toFixed(1)},${y.toFixed(1)} expected=${imgWidth.toFixed(1)}x${imgHeight.toFixed(1)} ` +
        `expectedLT=${imgLeft.toFixed(1)},${imgTop.toFixed(1)}` +
        (Math.abs(width - imgWidth) > 0.5 || Math.abs(height - imgHeight) > 0.5 ? ' !!! SIZE MISMATCH' : ''),
      );
    }
  };

  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, opacity: opacity ?? 1 },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      onLayout={__DEV__ ? onContainerLayout : undefined}
    >
      <Image
        source={frame.source}
        style={{
          width: frame.sheetWidth * scale,
          height: frame.sheetHeight * scale,
          position: 'absolute' as const,
          left: -((frame.offsetX * scale) + centeredCropLeft + leftCropOffset),
          top: -((frame.offsetY * scale) + topCropOffset),
        }}
        contentFit="contain"
        onLayout={__DEV__ ? onImageLayout : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' as const },
});
