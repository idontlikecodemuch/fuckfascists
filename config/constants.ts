// Report card drop window (times in ET)
export const REPORT_CARD_WINDOW_START_HOUR = 16; // 4pm ET Friday
export const REPORT_CARD_WINDOW_END_HOUR = 15;   // 3pm ET Saturday
export const REPORT_CARD_WINDOW_DAY = 5;         // Friday (0 = Sunday)

// Extension flagging frequency
// Options: 'session' | 'daily' | 'weekly'
export const EXTENSION_FLAG_FREQUENCY = 'session' as const;

// OpenSecrets API cache TTL
export const ENTITY_CACHE_TTL_DAYS = 60;

// Confidence score thresholds (0–1 scale)
export const CONFIDENCE_THRESHOLD_HIGH = 0.85;
export const CONFIDENCE_THRESHOLD_MEDIUM = 0.60;

// Curated entity list update URL
export const ENTITY_LIST_UPDATE_URL = 'https://raw.githubusercontent.com/[org]/fuckfascists-data/main/entities.json';

// Weekly report card drop schedule — published by a GitHub Action each Monday
export const DROP_SCHEDULE_URL = 'https://raw.githubusercontent.com/[org]/fuckfascists-data/main/drop-schedule.json';
