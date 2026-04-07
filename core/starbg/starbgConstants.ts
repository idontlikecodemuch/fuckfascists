/**
 * Internal tuning constants for the StarFieldBg component.
 *
 * All timing, sizing, opacity, and parallax values live here so the
 * entire appearance can be tuned without opening component files.
 *
 * The one master toggle (STARBG_PARALLAX_ENABLED) lives in config/constants.ts.
 */

// ── Layer content counts ─────────────────────────────────────────────────────
export const STARBG_TWINKLE_STAR_COUNT = 28;
export const STARBG_GALAXY_COUNT = 3;
export const STARBG_ROCK_COUNT = 2;

// ── Milky way band ───────────────────────────────────────────────────────────
// Milkyway JPGs have baked bgVoid background — rendered at full opacity as the base layer.
// This constant controls brightness dimming if needed (1.0 = full, 0.8 = slightly dimmed).
export const STARBG_MILKYWAY_OPACITY = 1.0;
export const STARBG_MILKYWAY_ROTATION_MIN = -15;
export const STARBG_MILKYWAY_ROTATION_MAX = 15;

// ── Galaxy / rock placement ──────────────────────────────────────────────────
export const STARBG_GALAXY_OPACITY_MIN = 0.06;
export const STARBG_GALAXY_OPACITY_MAX = 0.14;
export const STARBG_ROCK_OPACITY_MIN = 0.05;
export const STARBG_ROCK_OPACITY_MAX = 0.10;

// ── Twinkle stars ────────────────────────────────────────────────────────────
export const STARBG_TWINKLE_DURATION_MIN_MS = 1800;
export const STARBG_TWINKLE_DURATION_MAX_MS = 3500;
export const STARBG_TWINKLE_OPACITY_MIN = 0.1;
export const STARBG_TWINKLE_OPACITY_MAX = 0.9;
export const STARBG_TWINKLE_SIZE_MIN = 1;
export const STARBG_TWINKLE_SIZE_MAX = 3;

// ── Parallax depth rates ─────────────────────────────────────────────────────
// Tilt: max pixel offset from device rotation
export const STARBG_PARALLAX_TILT_MAX_OFFSET = 8;
export const STARBG_TILT_DEAD_ZONE = 0.02;

// Scroll: translateY multiplier per layer (smaller = farther away)
export const STARBG_PARALLAX_SCROLL_RATE_BG = 0.02;
export const STARBG_PARALLAX_SCROLL_RATE_MID = 0.05;
export const STARBG_PARALLAX_SCROLL_RATE_FG = 0.1;

// Tilt: multiplier per layer (smaller = farther away)
export const STARBG_PARALLAX_TILT_RATE_BG = 0.3;
export const STARBG_PARALLAX_TILT_RATE_MID = 0.6;
export const STARBG_PARALLAX_TILT_RATE_FG = 1.0;
