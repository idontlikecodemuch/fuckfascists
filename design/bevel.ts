import { ViewStyle } from 'react-native';
import { theme } from './tokens';

/**
 * Per-side border color style objects for beveled depth effects.
 *
 * Raised: bevelLight top/left, bevelDark bottom/right — panels, action buttons, avatar frames.
 * Inset: bevelInsetDark top/left, bevelInsetLight bottom/right — day tiles, confirmed buttons.
 * Focused raised: focusBevelLight top/left, focusBevelDark bottom/right — active panels.
 */

// ── Raised grey bevel (panels at rest) ──────────────────────────────────────

export const bevelRaised: ViewStyle = {
  borderWidth: theme.borders.bevel.width,
  borderTopColor: theme.colors.bevelLight,
  borderLeftColor: theme.colors.bevelLight,
  borderBottomColor: theme.colors.bevelDark,
  borderRightColor: theme.colors.bevelDark,
};

// ── Inset bevel (day tiles, confirmed buttons) ──────────────────────────────

export const bevelInset: ViewStyle = {
  borderWidth: theme.borders.bevel.width,
  borderTopColor: theme.colors.bevelInsetDark,
  borderLeftColor: theme.colors.bevelInsetDark,
  borderBottomColor: theme.colors.bevelInsetLight,
  borderRightColor: theme.colors.bevelInsetLight,
};

// ── Focused raised bevel (active panels, blue shift) ────────────────────────

export const bevelFocusRaised: ViewStyle = {
  borderWidth: theme.borders.bevel.width,
  borderTopColor: theme.colors.focusBevelLight,
  borderLeftColor: theme.colors.focusBevelLight,
  borderBottomColor: theme.colors.focusBevelDark,
  borderRightColor: theme.colors.focusBevelDark,
};

// ── Green inset bevel (confirmed/checked states) ────────────────────────────

export const bevelGreenInset: ViewStyle = {
  borderWidth: theme.borders.bevel.width,
  borderTopColor: '#1A3A1A',
  borderLeftColor: '#1A3A1A',
  borderBottomColor: '#2A5A2A',
  borderRightColor: '#2A5A2A',
};

// ── Green raised bevel (selected/online cells) ─────────────────────────────

export const bevelGreenRaised: ViewStyle = {
  borderWidth: theme.borders.bevel.width,
  borderTopColor: theme.colors.successGreenBright,
  borderLeftColor: theme.colors.successGreenBright,
  borderBottomColor: theme.colors.successGreenDeep,
  borderRightColor: theme.colors.successGreenDeep,
};

// ── Amber raised bevel (AVOID button) ───────────────────────────────────────

export const bevelAmberRaised: ViewStyle = {
  borderWidth: theme.borders.bevel.width,
  borderTopColor: theme.colors.amberActionLight,
  borderLeftColor: theme.colors.amberActionLight,
  borderBottomColor: theme.colors.amberActionDark,
  borderRightColor: theme.colors.amberActionDark,
};

// ── Amber plaque bevel (Info about section — thick 3px frame) ───────────────

export const bevelAmberPlaque: ViewStyle = {
  borderWidth: 3,
  borderTopColor: theme.colors.amberActionLight,
  borderLeftColor: theme.colors.amberActionLight,
  borderBottomColor: theme.colors.amberActionDark,
  borderRightColor: theme.colors.amberActionDark,
};
