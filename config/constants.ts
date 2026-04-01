import { theme } from '../design/tokens';

// Scorecard drop window (times in ET)
export const SCORECARD_WINDOW_START_HOUR = 16; // 4pm ET Friday
export const SCORECARD_WINDOW_END_HOUR = 15;   // 3pm ET Saturday
export const SCORECARD_WINDOW_DAY = 5;         // Friday (0 = Sunday)

// Extension flagging frequency
// Options: 'session' | 'daily' | 'weekly'
export const EXTENSION_FLAG_FREQUENCY: 'session' | 'daily' | 'weekly' = 'session';

// FEC API cache TTL
export const ENTITY_CACHE_TTL_DAYS = 60;

// Confidence score thresholds (0–1 scale)
export const CONFIDENCE_THRESHOLD_HIGH = 0.85;
export const CONFIDENCE_THRESHOLD_MEDIUM = 0.60;

// OpenFEC API base URL — primary data source as of v1.1
export const FEC_API_BASE_URL = 'https://api.open.fec.gov/v1';
export const OPEN_FOOD_FACTS_API_BASE_URL = 'https://world.openfoodfacts.org/api/v2';

// Curated entity list update URL
export const ENTITY_LIST_UPDATE_URL = 'https://raw.githubusercontent.com/idontlikecodemuch/fckfascists-data/main/entities.json';
export const PEOPLE_LIST_UPDATE_URL = 'https://raw.githubusercontent.com/idontlikecodemuch/fckfascists-data/main/people.json';

// Drop schedule is computed deterministically on-device.
// See core/dropSchedule/computeDropTime.ts.
// V2: Optional server override for schedule changes — see CLAUDE.md "V2 Server Ping" section.

// Info / FAQ / transparency content — editable in the data repo without an app release
export const INFO_CONTENT_URL = 'https://raw.githubusercontent.com/idontlikecodemuch/fckfascists-data/main/info.json';

// Map POI tap search
// Default radius passed to MKLocalPointsOfInterestRequest on iOS.
// At runtime, radius is computed dynamically from the visible region span
// (~2% of shorter dimension, clamped to MIN/MAX). This constant is the
// fallback when region data is unavailable.
export const POI_SEARCH_RADIUS_METERS = 50;
export const POI_SEARCH_RADIUS_MIN_METERS = 15;
export const POI_SEARCH_RADIUS_MAX_METERS = 200;
// Persistent cache TTL for barcode -> brand/entity resolutions.
// Keeps repeated shelf scans offline after the first successful lookup.
export const BARCODE_LOOKUP_CACHE_TTL_DAYS = 30;
export const BARCODE_SCAN_GUIDE_HEIGHT = 128;
export const BARCODE_SCAN_GUIDE_SIDE_INSET_PERCENT = 14;
// How long a tap cell's POI name list is cached in-memory before re-querying.
// Short TTL — only prevents duplicate API calls from accidental double-taps,
// not meant to persist results across active map exploration.
export const TAP_CACHE_TTL_MS = 60 * 1000; // 60 seconds
// Leading-edge debounce for iOS onPress tap search. First tap fires immediately;
// subsequent taps within this window are dropped. Prevents rapid taps on different
// map areas from stacking MKLocalPointsOfInterestRequest calls.
export const TAP_DEBOUNCE_MS = 500;

// Thursday nudge notification — reminds users to log avoids before Friday scorecard drop.
// Day of week: 0=Sunday, 4=Thursday. Hour in local time (24h).
export const NUDGE_DAY = 4;    // Thursday
export const NUDGE_HOUR = 19;  // 7pm local time


// ── Shared FX system ─────────────────────────────────────────────────────────
// Duration an avoid celebration effect stays on screen (ms).
export const FX_AVOID_DURATION_MS = 3000;
// Fade-out portion at the end of the avoid celebration (ms).
export const FX_AVOID_FADE_MS = 400;

// Launch screen art bounds
export const LAUNCH_HERO_LOGO_MAX_WIDTH = 220;
export const LAUNCH_HERO_LOGO_MAX_HEIGHT = 140;

// Beta overlay controls
export const BETA_FLOATING_BUTTON_SIZE = theme.a11y.minTapTarget;
export const BETA_FLOATING_BUTTON_BOTTOM = 100;
export const BETA_RESET_BUTTON_WIDTH = theme.a11y.minTapTarget + theme.space.md;
export const BETA_RESET_BUTTON_HEIGHT = theme.a11y.minTapTarget - theme.space.sm;
export const BETA_RESET_BUTTON_GAP = theme.space.sm;

// ── Track screen animation timing ────────────────────────────────────────────
// Arena transition when switching focus from grid/other person to single character.
export const ARENA_TRANSITION_MS = 500;
// Delay before day circles auto-collapse on first visit of the day.
export const DAY_CIRCLES_AUTO_COLLAPSE_DELAY_MS = 2000;
// Stagger between each row's collapse in the daily open animation.
export const DAY_CIRCLES_COLLAPSE_STAGGER_MS = 80;
// Duration of the day circles expand/collapse height animation.
export const DAY_CIRCLES_ANIMATE_MS = 300;
// Hit FX duration after an avoid tap.
export const ARENA_HIT_FX_MS = 800;
// Same-person focus pulse instead of a full arena transition.
export const ARENA_SAME_FIGURE_PULSE_MS = 220;
// Arena height: 16:9 aspect ratio from screen width, capped at this max.
export const ARENA_HEIGHT = 200;

// ── Track screen layout tuning ───────────────────────────────────────────────
// All visual sizing for the Track platform list. Adjust these to tune the
// entire list appearance without opening component files.
export const TRACK_ROW_PADDING_VERTICAL = 8;
export const TRACK_ROW_PADDING_HORIZONTAL = 12;
export const TRACK_CHILD_INDENT = 56;
export const TRACK_ROW_SPRITE_SIZE = 32;
export const TRACK_ROW_FONT_SIZE_NAME = 15;
export const TRACK_ROW_FONT_SIZE_SUBTITLE = 11;
export const TRACK_ROW_FONT_SIZE_COUNT = 14;
export const TRACK_ROW_FOCUS_BORDER_COLOR = theme.colors.focusAccent;
export const TRACK_ROW_FOCUS_BG_COLOR = theme.colors.focusTint;
export const TRACK_ROW_DIMMED_OPACITY = 0.45;
export const TRACK_CHILD_ROW_BG_COLOR = 'rgba(95, 174, 255, 0.06)';
export const TRACK_CHILD_GUIDE_COLOR = 'rgba(95, 174, 255, 0.55)';
export const TRACK_CHILD_FONT_SIZE_NAME = 13;
export const TRACK_CHILD_FONT_SIZE_COUNT = 13;
export const TRACK_BUTTON_WIDTH = 64;
export const TRACK_BUTTON_HEIGHT = 36;
export const TRACK_DAY_CIRCLE_SIZE = 28;
export const TRACK_DAY_CIRCLES_GAP = 4;
export const TRACK_EXPAND_INDICATOR_SIZE = 14;
export const TRACK_SPRITE_BUST_CROP_RATIO = 0.46;
export const TRACK_SPRITE_BUST_CROP_OFFSET_X = -0.04;
export const TRACK_SPRITE_BUST_CROP_OFFSET_Y = -0.01;
export const TRACK_FIGURE_FALLBACK_BG_COLOR = theme.colors.surface2;
export const TRACK_FIGURE_FALLBACK_BORDER_COLOR = theme.colors.highlightBlue;
export const TRACK_FIGURE_FALLBACK_TEXT_COLOR = theme.colors.rewardYellow;
// Arena tuning
export const TRACK_ARENA_GRID_CELL_SIZE = 84;
export const TRACK_ARENA_GRID_CELL_MIN = 40;
export const TRACK_ARENA_GRID_CELL_MAX = 84;
export const TRACK_ARENA_GRID_CROP_RATIO = 0.48;
export const TRACK_ARENA_GRID_CROP_OFFSET_X = -0.06;
export const TRACK_ARENA_GRID_CROP_OFFSET_Y = -0.03;
export const TRACK_ARENA_SINGLE_CROP_RATIO = 0.72;
export const TRACK_ARENA_SINGLE_CROP_OFFSET_X = -0.03;
export const TRACK_ARENA_SINGLE_CROP_OFFSET_Y = -0.02;
export const TRACK_ARENA_SINGLE_DISPLAY_RATIO = 0.9;
export const TRACK_ARENA_SINGLE_LEFT_INSET = 16;
export const TRACK_ARENA_SINGLE_BOTTOM_INSET = 0;

// ── Parent company short names (Track screen group headers) ──────────────────
// Data mapping for display — not user-facing copy.
export const SHORT_PARENT_NAMES: Record<string, string> = {
  'Meta Platforms': 'META',
  'Amazon.com Inc': 'AMAZON',
  'Alphabet Inc': 'ALPHABET',
  'X Corp': 'X CORP',
};

// ── Screenshot harness (dev only) ────────────────────────────────────────────
// Time to wait after rendering a step before capturing (ms).
export const HARNESS_STEP_SETTLE_MS = 400;
// Time to wait after capture before advancing to next step (ms).
export const HARNESS_CAPTURE_DELAY_MS = 400;

// ── Safe area ────────────────────────────────────────────────────────────────
// Minimum top padding for screens that don't use SafeAreaView or need manual
// inset handling (e.g. absolute overlays). On notch/island devices the system
// inset is larger — this is the floor for non-notch devices.
export const SAFE_AREA_TOP_MIN = 52;

// Controls whether the public figure / CEO name is shown in the UI.
// true = show, false = hide. Compile-time constant — change and rebuild to toggle.
// SHOW_FIGURE_NAME_IN_CARD: off by default — business card is an informational FEC data screen.
// SHOW_FIGURE_NAME_IN_POPUP: on by default — extension popup benefits from the confrontational framing.
export const SHOW_FIGURE_NAME_IN_CARD  = false;
export const SHOW_FIGURE_NAME_IN_POPUP = true;
