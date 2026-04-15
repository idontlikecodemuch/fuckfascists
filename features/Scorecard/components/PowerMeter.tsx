import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { PowerTier } from '../data/computePowerTier';
import { powerMeterAssets } from '../../../core/scorecard/scorecardAssets';

const BAR_WIDTH = 24;

interface PowerMeterProps {
  tier: PowerTier;
  /** Height of the content zone the bar should fill. */
  height: number;
}

/**
 * Vertical power meter bar — left edge of the rendered card.
 * Selects one of 4 tier-variant pixel art assets based on avoid count.
 * Lower tiers render at reduced opacity (atmospheric, not pulling focus).
 */
export function PowerMeter({ tier, height }: PowerMeterProps) {
  const source = powerMeterAssets[tier.index];
  const isLowerTier = tier.index <= 1;

  return (
    <View
      style={[styles.container, { height }]}
      collapsable={false}
      accessibilityElementsHidden
    >
      <Image
        source={source}
        style={[
          styles.bar,
          { height: height * tier.fill },
          isLowerTier && styles.reducedOpacity,
        ]}
        resizeMode="stretch"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: BAR_WIDTH,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: BAR_WIDTH,
  },
  reducedOpacity: {
    opacity: 0.75,
  },
});
