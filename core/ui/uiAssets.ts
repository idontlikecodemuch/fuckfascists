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
