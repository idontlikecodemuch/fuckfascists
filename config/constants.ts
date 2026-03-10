// Report card drop window (times in ET)
export const REPORT_CARD_WINDOW_START_HOUR = 16; // 4pm ET Friday
export const REPORT_CARD_WINDOW_END_HOUR = 15;   // 3pm ET Saturday
export const REPORT_CARD_WINDOW_DAY = 5;         // Friday (0 = Sunday)

// Extension flagging frequency
// Options: 'session' | 'daily' | 'weekly'
export const EXTENSION_FLAG_FREQUENCY = 'session' as const;

// FEC API cache TTL
export const ENTITY_CACHE_TTL_DAYS = 60;

// Delay between entity fetches in the data pipeline (ms)
export const FETCH_DELAY_MS = 500;

// Additional delay before each Schedule B request (ms) — Schedule B is a heavier endpoint
export const FETCH_SCHEDULE_B_DELAY_MS = 2_000;

// Confidence score thresholds (0–1 scale)
export const CONFIDENCE_THRESHOLD_HIGH = 0.85;
export const CONFIDENCE_THRESHOLD_MEDIUM = 0.60;

// OpenFEC API base URL — primary data source as of v1.1
export const FEC_API_BASE_URL = 'https://api.open.fec.gov/v1';

// Curated entity list update URL
export const ENTITY_LIST_UPDATE_URL = 'https://raw.githubusercontent.com/[org]/fuckfascists-data/main/entities.json';

// Weekly report card drop schedule — published by a GitHub Action each Monday
export const DROP_SCHEDULE_URL = 'https://raw.githubusercontent.com/[org]/fuckfascists-data/main/drop-schedule.json';

// Info / FAQ / transparency content — editable in the data repo without an app release
export const INFO_CONTENT_URL = 'https://raw.githubusercontent.com/[org]/fuckfascists-data/main/info.json';

// Controls whether the public figure / CEO name is shown in the UI.
// true = show, false = hide. Compile-time constant — change and rebuild to toggle.
// SHOW_FIGURE_NAME_IN_CARD: off by default — business card is an informational FEC data screen.
// SHOW_FIGURE_NAME_IN_POPUP: on by default — extension popup benefits from the confrontational framing.
export const SHOW_FIGURE_NAME_IN_CARD  = false;
export const SHOW_FIGURE_NAME_IN_POPUP = true;
