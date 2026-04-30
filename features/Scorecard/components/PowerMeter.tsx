import React from 'react';
import { Image, PixelRatio, StyleSheet, View } from 'react-native';
import type { PowerTier } from '../data/computePowerTier';
import { powerMeterAssets } from '../../../core/scorecard/scorecardAssets';
import {
  POWER_METER_TIER_NATIVE_H,
  SCORECARD_BAR_BOTTOM,
  SCORECARD_BAR_LEFT,
  SCORECARD_BAR_TUBE_HEIGHT_DESIGN,
  SCORECARD_BAR_WIDTH,
} from '../../../config/constants';

interface PowerMeterProps {
  tier: PowerTier;
}

const pr = PixelRatio.get();
const scale = (px: number) => px / pr;

// idle's native height defines the baseline tube. Higher tiers' PNGs are
// taller because their top decoration extends above the tube — so the
// rendered height scales with native PNG height while the bar TUBE itself
// stays anchored to a fixed bottom and lands at the same physical place.
const IDLE_NATIVE_H = POWER_METER_TIER_NATIVE_H[0];

/**
 * Vertical power meter — left edge of the rendered card.
 *
 * Geometry intent (per the design mockup):
 *   • Width is constant across tiers (SCORECARD_BAR_WIDTH).
 *   • The bar TUBE portion stays the same visual size — anchored to a fixed
 *     bottom (SCORECARD_BAR_BOTTOM from the canvas bottom).
 *   • The TOP decoration (flame, glow, etc.) extends UP further for higher
 *     tiers — the PNG asset itself is taller for higher tiers because the
 *     decoration is drawn into it. We scale the rendered height by the
 *     native PNG height ratio so the decoration's pixel art lands correctly.
 *
 * Result: every week the bar tube sits in the same place; the crown is what
 * grows or shrinks based on the avoid count.
 */
export function PowerMeter({ tier }: PowerMeterProps) {
  const source = powerMeterAssets[tier.index];
  const nativeH = POWER_METER_TIER_NATIVE_H[tier.index] ?? IDLE_NATIVE_H;
  const renderH = SCORECARD_BAR_TUBE_HEIGHT_DESIGN * (nativeH / IDLE_NATIVE_H);

  return (
    <View
      style={[
        styles.container,
        {
          width: scale(SCORECARD_BAR_WIDTH),
          height: scale(renderH),
          left: scale(SCORECARD_BAR_LEFT),
          bottom: scale(SCORECARD_BAR_BOTTOM),
        },
      ]}
      collapsable={false}
      accessibilityElementsHidden
      pointerEvents="none"
    >
      <Image
        source={source}
        style={[
          styles.bar,
          { width: scale(SCORECARD_BAR_WIDTH), height: scale(renderH) },
        ]}
        resizeMode="stretch"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  bar: {
    // Subtle amber drop shadow — keeps the bar feeling "lit" without
    // pulling focus from the gold/cyan content above.
    shadowColor: 'rgba(255, 201, 60, 0.45)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
  },
});
