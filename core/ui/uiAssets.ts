/**
 * UI kit asset require map.
 * Only exports assets that are actively imported by components.
 * Unused exports were quarantined — see _quarantine/UNDO.md.
 */
import type { ImageSourcePropType } from 'react-native';

// ── Header bar (separate asset, not from UI kit sheet) ──────────────────────
export const headerBar: ImageSourcePropType = require('../../assets/pixel/ui/header_bar.png');

// ── Eagle seal (manila folder business card) ────────────────────────────────
// Large: red-tinted on folder surface. Small: dark on document header.
export const sealEagle: ImageSourcePropType = require('../../assets/pixel/ui/seal_eagle.png');
export const sealEagleSmall: ImageSourcePropType = require('../../assets/pixel/ui/seal_eagle_sm.png');

// ── Cash bills (post-avoid money particles) ─────────────────────────────────
// 4 variants at ~24px wide, different angles. Cycled per particle.
export const cashBills: ImageSourcePropType[] = [
  require('../../assets/pixel/ui/cash_0.png'),
  require('../../assets/pixel/ui/cash_1.png'),
  require('../../assets/pixel/ui/cash_2.png'),
  require('../../assets/pixel/ui/cash_3.png'),
];
