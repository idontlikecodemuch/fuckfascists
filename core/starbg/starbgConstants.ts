/**
 * Internal tuning constants for the StarFieldBg component.
 *
 * All timing, sizing, opacity, and parallax values live here so the
 * entire appearance can be tuned without opening component files.
 *
 * The one master toggle (STARBG_PARALLAX_ENABLED) lives in config/constants.ts.
 */

// ── Layer content counts ─────────────────────────────────────────────────────
export const STARBG_TWINKLE_STAR_COUNT = 36;
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

// ── Shooting streaks ─────────────────────────────────────────────────────────
export const STARBG_STREAK_INTERVAL_MS = 6000;
export const STARBG_STREAK_DURATION_MS = 1000;
export const STARBG_STREAK_LENGTH = 70;
export const STARBG_STREAK_COUNT = 2;    // number of independent streaks

// ── Parallax depth rates ─────────────────────────────────────────────────────
// Tilt: max pixel offset from device rotation
export const STARBG_PARALLAX_TILT_MAX_OFFSET = 16;
export const STARBG_TILT_DEAD_ZONE = 0.015;
// Pitch (forward/back tilt) has a smaller natural range than roll (side-to-side),
// so we boost it to feel equally responsive.
export const STARBG_PITCH_BOOST = 2.5;

// ── Subtle streak variant ───────────────────────────────────────────────────
export const STARBG_SUBTLE_STREAK_COUNT = 3;     // more frequent, less prominent
export const STARBG_SUBTLE_STREAK_INTERVAL_MS = 4000;
export const STARBG_SUBTLE_STREAK_DURATION_MS = 800;
export const STARBG_SUBTLE_STREAK_LENGTH = 50;

// Scroll: translateY multiplier per layer (smaller = farther away)
export const STARBG_PARALLAX_SCROLL_RATE_BG = 0.04;
export const STARBG_PARALLAX_SCROLL_RATE_MID = 0.10;
export const STARBG_PARALLAX_SCROLL_RATE_FG = 0.18;

// Tilt: multiplier per layer (smaller = farther away)
export const STARBG_PARALLAX_TILT_RATE_BG = 0.4;
export const STARBG_PARALLAX_TILT_RATE_MID = 0.75;
export const STARBG_PARALLAX_TILT_RATE_FG = 1.2;
