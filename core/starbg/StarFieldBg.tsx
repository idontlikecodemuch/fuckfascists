/**
 * StarFieldBg — Animated star field background with parallax.
 * 4 depth layers: star texture + milky way, galaxy/rock PNGs, twinkle stars.
 * Usage: <StarFieldBg seed="info" /> or <StarFieldBg seed="info" scrollY={scrollY} />
 */

import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, AccessibilityInfo, PixelRatio } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';
import { useStarLayout } from './useStarLayout';
import type { TwinkleStarData } from './useStarLayout';
import { useParallax } from './useParallax';
import { ShootingStreak } from './ShootingStreak';
import { starbgBase } from './starbgAssets';
import {
  STARBG_TWINKLE_OPACITY_MIN, STARBG_TWINKLE_OPACITY_MAX,
  STARBG_TWINKLE_STAR_COUNT, STARBG_STREAK_COUNT,
} from './starbgConstants';
import { STARBG_PARALLAX_ENABLED } from '../../config/constants';

// Low-perf: @2x devices get halved twinkle + no tilt parallax.
const IS_LOW_PERF = PixelRatio.get() <= 2;
const TWINKLE_N = IS_LOW_PERF ? Math.ceil(STARBG_TWINKLE_STAR_COUNT / 2) : STARBG_TWINKLE_STAR_COUNT;

export interface StarFieldBgProps {
  seed?: string;
  scrollY?: SharedValue<number>;
  parallaxEnabled?: boolean;
}

// ── TwinkleStar ──────────────────────────────────────────────────────────────

const TwinkleStar = React.memo(function TwinkleStar({
  star,
  reducedMotion,
}: {
  star: TwinkleStarData;
  reducedMotion: boolean;
}) {
  const opacity = useSharedValue(reducedMotion ? 0.5 : STARBG_TWINKLE_OPACITY_MIN);
  const scale = useSharedValue(reducedMotion ? 1 : 0.8);

  useEffect(() => {
    if (reducedMotion) return;
    const halfDur = star.durationMs / 2;
    const ease = Easing.inOut(Easing.sin);

    opacity.value = withDelay(
      star.delayMs,
      withRepeat(withTiming(STARBG_TWINKLE_OPACITY_MAX, { duration: halfDur, easing: ease }), -1, true),
    );
    // Glyphs pulse scale more noticeably, dots get a subtle throb
    const maxScale = star.glyph != null ? 1.3 : 1.15;
    scale.value = withDelay(
      star.delayMs,
      withRepeat(withTiming(maxScale, { duration: halfDur, easing: ease }), -1, true),
    );
  }, [reducedMotion]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const [r, g, b] = star.color;
  const colorStr = `rgb(${r},${g},${b})`;

  if (star.glyph != null) {
    return (
      <Animated.Text
        style={[
          styles.twinkleGlyph,
          { left: star.x, top: star.y, fontSize: star.size, color: colorStr },
          style,
        ]}
      >
        {star.glyph}
      </Animated.Text>
    );
  }

  return (
    <Animated.View
      style={[
        styles.twinkleDot,
        {
          left: star.x - star.size / 2,
          top: star.y - star.size / 2,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          backgroundColor: colorStr,
        },
        style,
      ]}
    />
  );
});

// ── Main component ───────────────────────────────────────────────────────────

export function StarFieldBg({
  seed = 'default',
  scrollY,
  parallaxEnabled = STARBG_PARALLAX_ENABLED,
}: StarFieldBgProps) {
  const { width, height } = useWindowDimensions();
  const layout = useStarLayout(seed, width, height);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!cancelled) setReducedMotion(v);
    });
    return () => { cancelled = true; };
  }, []);

  // Disable tilt parallax on low-perf devices; scroll parallax is still free.
  const effectiveParallax = parallaxEnabled && !reducedMotion && !IS_LOW_PERF;
  const { bgStyle, midStyle, fgStyle } = useParallax(effectiveParallax, scrollY);

  return (
    <View
      style={styles.container}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {/* Layer 1: BG — star texture + milky way */}
      <Animated.View style={[styles.layer, bgStyle]}>
        {starbgBase != null && (
          <Image source={starbgBase} style={styles.baseTexture} resizeMode="cover" />
        )}
        {layout.milkyway != null && (
          <Image
            source={layout.milkyway.source}
            style={[
              styles.milkyway,
              {
                opacity: layout.milkyway.opacity,
                transform: [{ rotate: `${layout.milkyway.rotation}deg` }],
              },
            ]}
            resizeMode="contain"
          />
        )}
      </Animated.View>

      {/* Layer 2: MID — galaxies + rocks */}
      <Animated.View style={[styles.layer, midStyle]}>
        {layout.galaxies.map((asset) => (
          <Image
            key={asset.assetKey}
            source={asset.source}
            style={[
              styles.asset,
              {
                left: `${(asset.x * 100).toFixed(1)}%` as unknown as number,
                top: `${(asset.y * 100).toFixed(1)}%` as unknown as number,
                opacity: asset.opacity,
                // @ts-expect-error — RN 0.76 experimental, not in stable types yet
                ...(IS_LOW_PERF ? {} : { experimental_mixBlendMode: 'screen' }),
                transform: [
                  { scale: asset.scale },
                  { rotate: `${asset.rotation}deg` },
                  { scaleX: asset.flipX ? -1 : 1 },
                ],
              },
            ]}
            resizeMode="contain"
          />
        ))}
        {layout.rocks.map((asset) => (
          <Image
            key={asset.assetKey}
            source={asset.source}
            style={[
              styles.asset,
              {
                left: `${(asset.x * 100).toFixed(1)}%` as unknown as number,
                top: `${(asset.y * 100).toFixed(1)}%` as unknown as number,
                opacity: asset.opacity,
                transform: [
                  { scale: asset.scale },
                  { rotate: `${asset.rotation}deg` },
                  { scaleX: asset.flipX ? -1 : 1 },
                ],
              },
            ]}
            resizeMode="contain"
          />
        ))}
      </Animated.View>

      {/* Layer 3: FG — twinkle stars + shooting streaks */}
      <Animated.View style={[styles.layer, fgStyle]}>
        {layout.twinkleStars.slice(0, TWINKLE_N).map((star, i) => (
          <TwinkleStar key={`tw-${i}`} star={star} reducedMotion={reducedMotion} />
        ))}
        {Array.from({ length: STARBG_STREAK_COUNT }, (_, i) => (
          <ShootingStreak
            key={`streak-${i}`}
            screenWidth={width}
            screenHeight={height}
            reducedMotion={reducedMotion}
            seed={seed.length * 7919 + i * 997}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const absFill = { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined };
const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  layer: { ...StyleSheet.absoluteFillObject },
  baseTexture: absFill,
  milkyway: {
    position: 'absolute' as const,
    width: '100%' as unknown as number,
    height: '60%' as unknown as number,
    top: '20%' as unknown as number,
  },
  asset: { position: 'absolute', width: 200, height: undefined, aspectRatio: 1 },
  twinkleDot: { position: 'absolute' },
  twinkleGlyph: { position: 'absolute', textAlign: 'center' },
});
