/**
 * Seeded PRNG + deterministic star field layout generation.
 *
 * Given a seed string, produces stable positions for all decorative
 * elements (galaxies, rocks, milky way selection, twinkle stars).
 * Same seed = same layout every mount.
 */

import { useMemo } from 'react';
import { starbgGalaxies, starbgRocks, starbgMilkyways } from './starbgAssets';
import {
  STARBG_TWINKLE_STAR_COUNT,
  STARBG_GALAXY_COUNT,
  STARBG_ROCK_COUNT,
  STARBG_MILKYWAY_OPACITY,
  STARBG_MILKYWAY_ROTATION_MIN,
  STARBG_MILKYWAY_ROTATION_MAX,
  STARBG_GALAXY_OPACITY_MIN,
  STARBG_GALAXY_OPACITY_MAX,
  STARBG_ROCK_OPACITY_MIN,
  STARBG_ROCK_OPACITY_MAX,
  STARBG_TWINKLE_DURATION_MIN_MS,
  STARBG_TWINKLE_DURATION_MAX_MS,
  STARBG_TWINKLE_OPACITY_MIN,
  STARBG_TWINKLE_OPACITY_MAX,
  STARBG_TWINKLE_SIZE_MIN,
  STARBG_TWINKLE_SIZE_MAX,
} from './starbgConstants';
import type { ImageSourcePropType } from 'react-native';

// ── PRNG (djb2 + mulberry32) ─────────────────────────────────────────────────
// djb2 matches core/dropSchedule/computeDropTime.ts:43-49

function djb2(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (((hash << 5) + hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface PlacedAsset {
  assetKey: string;
  source: ImageSourcePropType;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  flipX: boolean;
  rotation: number;
}

export interface TwinkleStarData {
  x: number;
  y: number;
  size: number;
  color: readonly [number, number, number];
  durationMs: number;
  delayMs: number;
  glyph: string | null;  // '\u2726' or '\u2727' for star characters, null for dot
}

export interface MilkyWayData {
  source: ImageSourcePropType;
  opacity: number;
  rotation: number;
}

export interface StarLayout {
  milkyway: MilkyWayData | null;
  galaxies: PlacedAsset[];
  rocks: PlacedAsset[];
  twinkleStars: TwinkleStarData[];
}

// ── Star colors (weighted selection) ─────────────────────────────────────────

const STAR_COLORS: readonly (readonly [readonly [number, number, number], number])[] = [
  [[255, 255, 255], 0.65],   // white
  [[255, 240, 190], 0.17],   // warm yellow
  [[170, 210, 255], 0.18],   // cool blue
] as const;

function pickColor(prng: () => number): readonly [number, number, number] {
  const roll = prng();
  let cumulative = 0;
  for (const [color, weight] of STAR_COLORS) {
    cumulative += weight;
    if (roll < cumulative) return color;
  }
  return STAR_COLORS[0]![0];
}

// ── Layout generation ────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function pickN<T>(arr: T[], n: number, prng: () => number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(prng() * copy.length);
    result.push(copy.splice(idx, 1)[0]!);
  }
  return result;
}

function generateLayout(
  seed: string,
  screenWidth: number,
  screenHeight: number,
): StarLayout {
  const prng = mulberry32(djb2(seed));

  // ── Milky way ──
  const milkywayKeys = Object.keys(starbgMilkyways);
  let milkyway: MilkyWayData | null = null;
  if (milkywayKeys.length > 0) {
    const key = milkywayKeys[Math.floor(prng() * milkywayKeys.length)]!;
    milkyway = {
      source: starbgMilkyways[key]!,
      opacity: STARBG_MILKYWAY_OPACITY,
      rotation: lerp(STARBG_MILKYWAY_ROTATION_MIN, STARBG_MILKYWAY_ROTATION_MAX, prng()),
    };
  }

  // ── Galaxies — spread across grid zones to prevent clumping ──
  const galaxyKeys = Object.keys(starbgGalaxies);
  const selectedGalaxies = pickN(galaxyKeys, STARBG_GALAXY_COUNT, prng);
  const galaxies: PlacedAsset[] = selectedGalaxies.map((key, i) => ({
    assetKey: key,
    source: starbgGalaxies[key]!,
    x: lerp(0.05, 0.7, (i / Math.max(1, selectedGalaxies.length - 1)) + (prng() * 0.2 - 0.1)),
    y: lerp(0.05, 0.85, prng()),
    opacity: lerp(STARBG_GALAXY_OPACITY_MIN, STARBG_GALAXY_OPACITY_MAX, prng()),
    scale: lerp(0.6, 1.2, prng()),
    flipX: prng() > 0.5,
    rotation: lerp(-20, 20, prng()),
  }));

  // ── Rocks ──
  const rockKeys = Object.keys(starbgRocks);
  const selectedRocks = pickN(rockKeys, STARBG_ROCK_COUNT, prng);
  const rocks: PlacedAsset[] = selectedRocks.map((key) => ({
    assetKey: key,
    source: starbgRocks[key]!,
    x: lerp(0.0, 0.8, prng()),
    y: lerp(0.6, 0.95, prng()),
    opacity: lerp(STARBG_ROCK_OPACITY_MIN, STARBG_ROCK_OPACITY_MAX, prng()),
    scale: lerp(0.5, 1.0, prng()),
    flipX: prng() > 0.5,
    rotation: lerp(-10, 10, prng()),
  }));

  // ── Twinkle stars ──
  const twinkleStars: TwinkleStarData[] = [];
  for (let i = 0; i < STARBG_TWINKLE_STAR_COUNT; i++) {
    // ~30% of twinkle stars are glyph characters (✦ ✧)
    const glyphRoll = prng();
    const glyph = glyphRoll < 0.18 ? '\u2726' : glyphRoll < 0.30 ? '\u2727' : null;

    twinkleStars.push({
      x: prng() * screenWidth,
      y: prng() * screenHeight,
      size: glyph != null ? lerp(8, 14, prng()) : lerp(STARBG_TWINKLE_SIZE_MIN, STARBG_TWINKLE_SIZE_MAX, prng()),
      color: pickColor(prng),
      durationMs: lerp(STARBG_TWINKLE_DURATION_MIN_MS, STARBG_TWINKLE_DURATION_MAX_MS, prng()),
      delayMs: prng() * STARBG_TWINKLE_DURATION_MAX_MS,
      glyph,
    });
  }

  return { milkyway, galaxies, rocks, twinkleStars };
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useStarLayout(
  seed: string,
  screenWidth: number,
  screenHeight: number,
): StarLayout {
  return useMemo(
    () => generateLayout(seed, screenWidth, screenHeight),
    [seed, screenWidth, screenHeight],
  );
}
