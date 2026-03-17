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
  /** Display size in points (square). */
  size: number;
  /** Optional opacity (e.g. 0.4 for dimmed neutral). */
  opacity?: number;
}

/**
 * Renders a single static frame from a CEO sprite sheet.
 * Shows nothing when spriteId is null or no sprite exists in the manifest.
 */
export function SpriteView({ spriteId, state, variant, size, opacity }: SpriteViewProps) {
  if (!spriteId) return null;

  const frame = getSpriteFrame(spriteId, state, variant);
  if (!frame) return null;

  const scale = size / frame.frameWidth;

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
          left: -(frame.offsetX * scale),
          top: -(frame.offsetY * scale),
        }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' as const },
});
