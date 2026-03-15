// Report card drop window (times in ET)
export const REPORT_CARD_WINDOW_START_HOUR = 16; // 4pm ET Friday
export const REPORT_CARD_WINDOW_END_HOUR = 15;   // 3pm ET Saturday
export const REPORT_CARD_WINDOW_DAY = 5;         // Friday (0 = Sunday)

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

// Curated entity list update URL
export const ENTITY_LIST_UPDATE_URL = 'https://raw.githubusercontent.com/[org]/fuckfascists-data/main/entities.json';

// Drop schedule is computed deterministically on-device.
// See core/dropSchedule/computeDropTime.ts.
// V2: Optional server override for schedule changes — see CLAUDE.md "V2 Server Ping" section.

// Info / FAQ / transparency content — editable in the data repo without an app release
export const INFO_CONTENT_URL = 'https://raw.githubusercontent.com/[org]/fuckfascists-data/main/info.json';

// Map POI tap search
// Default radius passed to MKLocalPointsOfInterestRequest on iOS.
// At runtime, radius is computed dynamically from the visible region span
// (~2% of shorter dimension, clamped to MIN/MAX). This constant is the
// fallback when region data is unavailable.
export const POI_SEARCH_RADIUS_METERS = 50;
export const POI_SEARCH_RADIUS_MIN_METERS = 15;
export const POI_SEARCH_RADIUS_MAX_METERS = 200;
// How long a tap cell's POI name list is cached in-memory before re-querying.
export const TAP_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
// Leading-edge debounce for iOS onPress tap search. First tap fires immediately;
// subsequent taps within this window are dropped. Prevents rapid taps on different
// map areas from stacking MKLocalPointsOfInterestRequest calls.
export const TAP_DEBOUNCE_MS = 500;

// Controls whether the public figure / CEO name is shown in the UI.
// true = show, false = hide. Compile-time constant — change and rebuild to toggle.
// SHOW_FIGURE_NAME_IN_CARD: off by default — business card is an informational FEC data screen.
// SHOW_FIGURE_NAME_IN_POPUP: on by default — extension popup benefits from the confrontational framing.
export const SHOW_FIGURE_NAME_IN_CARD  = false;
export const SHOW_FIGURE_NAME_IN_POPUP = true;
