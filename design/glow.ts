import type { BoxShadowValue } from 'react-native';
import { theme } from './tokens';

export type GlowIntensity = 'subtle' | 'mid' | 'strong';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Build a layered outer-glow `boxShadow` array.
 *
 * Color is any 6-char hex (e.g. `theme.colors.rewardYellow`); intensity picks
 * a blur/spread/opacity step from `theme.glow.intensities`. Two stops are
 * always returned (inner rim + outer atmospheric halo) so glows read
 * consistently across surfaces.
 *
 * Inset glows + arena rim treatments live on the legacy `theme.glow.*` fields
 * — this helper is for outer halos only.
 */
export function glow(hex: string, intensity: GlowIntensity = 'mid'): BoxShadowValue[] {
  const { r, g, b } = hexToRgb(hex);
  const { inner, outer } = theme.glow.intensities[intensity];
  return [
    {
      offsetX: 0,
      offsetY: 0,
      blurRadius: inner.blurRadius,
      spreadDistance: inner.spreadDistance,
      color: `rgba(${r},${g},${b},${inner.opacity})`,
    },
    {
      offsetX: 0,
      offsetY: 0,
      blurRadius: outer.blurRadius,
      spreadDistance: outer.spreadDistance,
      color: `rgba(${r},${g},${b},${outer.opacity})`,
    },
  ];
}
