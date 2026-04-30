/**
 * Scorecard pixel art asset require map.
 * Metro bundler requires static require() strings — do not use variables.
 */
import type { ImageSourcePropType } from 'react-native';

/** Starfield background for the rendered card (JPEG, ~377KB, no alpha). */
export const scorecardBg: ImageSourcePropType =
  require('../../assets/pixel/scorecard/starbg.jpg');

/** Gold frame overlay (transparent interior). */
export const scorecardFrame: ImageSourcePropType =
  require('../../assets/pixel/scorecard/frame.png');

/** Scanline tile (1080×4, 1px dark row + 3px transparent) — tiled vertically
 *  to overlay subtle CRT-style scanlines on the rendered card. */
export const scorecardScanlines: ImageSourcePropType =
  require('../../assets/pixel/scorecard/scanlines.png');

/** Power meter tier assets — indexed by tier index (0–3). */
export const powerMeterAssets: ImageSourcePropType[] = [
  require('../../assets/pixel/scorecard/power_idle.png'),
  require('../../assets/pixel/scorecard/power_hot.png'),
  require('../../assets/pixel/scorecard/power_fck.png'),
  require('../../assets/pixel/scorecard/power_legendary.png'),
];
