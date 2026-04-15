import { POWER_METER_TIERS } from '../../../config/constants';

export interface PowerTier {
  fill: number;   // 0–1 — how full the bar is
  label: string;  // 'warming-up' | 'powered' | 'charged' | 'overflowing'
  index: number;  // tier index (0-based)
}

/**
 * Determines the power meter tier for a given avoid count.
 * Walks the tier array in reverse to find the highest matching tier.
 * Returns the first tier (warming-up) if count >= 1, or null if count is 0.
 */
export function computePowerTier(avoidCount: number): PowerTier | null {
  if (avoidCount < 1) return null;

  for (let i = POWER_METER_TIERS.length - 1; i >= 0; i--) {
    if (avoidCount >= POWER_METER_TIERS[i].min) {
      return {
        fill: POWER_METER_TIERS[i].fill,
        label: POWER_METER_TIERS[i].label,
        index: i,
      };
    }
  }

  return { fill: POWER_METER_TIERS[0].fill, label: POWER_METER_TIERS[0].label, index: 0 };
}
