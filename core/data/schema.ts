/**
 * SQLite DDL for the local database.
 * Used by the mobile app's SqliteAdapter — not imported by the browser extension.
 *
 * Privacy note: all data in this database is encrypted at rest
 * (iOS: NSFileProtectionComplete, Android: FBE via minSdkVersion 29).
 * Coordinates are stored ONLY for avoided entities (entity_avoid_pins),
 * auto-purged daily. Browsing history is NEVER stored.
 * Only affirmative avoidance actions are recorded — there is no "support" table.
 */

export const TABLE_ENTITY_AVOIDS = 'entity_avoid_events';
export const TABLE_PLATFORM_AVOIDS = 'platform_avoid_events';
export const TABLE_CACHE = 'cache';
export const TABLE_AVOID_PINS = 'entity_avoid_pins';

/**
 * entity_avoid_events
 * Primary key is (entity_id, date) so an upsert increments count atomically.
 * No time component, no location — date only (YYYY-MM-DD).
 */
export const DDL_ENTITY_AVOIDS = `
  CREATE TABLE IF NOT EXISTS ${TABLE_ENTITY_AVOIDS} (
    entity_id TEXT    NOT NULL,
    date      TEXT    NOT NULL,
    count     INTEGER NOT NULL DEFAULT 1,
    surface   INTEGER,
    PRIMARY KEY (entity_id, date)
  );
`;

/** Migration: add surface column to existing entity_avoid_events tables. */
export const MIGRATE_ADD_SURFACE_COLUMN = `
  ALTER TABLE ${TABLE_ENTITY_AVOIDS} ADD COLUMN surface INTEGER;
`;

/**
 * platform_avoid_events
 * Primary key is (platform_id, date) so an upsert increments count atomically.
 * No time component, no location — date only (YYYY-MM-DD).
 * Mirrors entity_avoid_events structure for consistency.
 */
export const DDL_PLATFORM_AVOIDS = `
  CREATE TABLE IF NOT EXISTS ${TABLE_PLATFORM_AVOIDS} (
    platform_id TEXT    NOT NULL,
    date        TEXT    NOT NULL,
    count       INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (platform_id, date)
  );
`;

/**
 * cache
 * Stores FEC API results keyed by normalize(brandName + areaHash).
 * The key never contains raw coordinates — areaHash is a rough-area token.
 * fetched_at is a Unix timestamp in milliseconds used for TTL comparisons.
 */
export const DDL_CACHE = `
  CREATE TABLE IF NOT EXISTS ${TABLE_CACHE} (
    key                   TEXT    PRIMARY KEY,
    fec_committee_id      TEXT    NOT NULL,
    donation_summary_json TEXT    NOT NULL,
    confidence            REAL    NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    fetched_at            INTEGER NOT NULL
  );
`;

/**
 * entity_avoid_pins
 * Stores map pin coordinates for avoided entities — used to hydrate the map
 * with today's avoided markers on launch.
 *
 * PRIVACY RELAXATION: This deliberately stores coordinates locally.
 * Coordinates are stored only for entities the user has actively avoided,
 * only on-device, encrypted at rest (same as all other tables in fuckfascists.db),
 * and auto-purged daily. This may be reverted to session-only storage if the team
 * decides coordinates should never be persisted. See Known Limitations in CLAUDE.md.
 */
export const DDL_AVOID_PINS = `
  CREATE TABLE IF NOT EXISTS ${TABLE_AVOID_PINS} (
    entity_id TEXT NOT NULL,
    date      TEXT NOT NULL,
    latitude  REAL NOT NULL,
    longitude REAL NOT NULL,
    name      TEXT NOT NULL,
    PRIMARY KEY (entity_id, date)
  );
`;

/** Ordered list of all DDL statements — run in sequence to initialize the DB. */
export const ALL_DDL = [DDL_ENTITY_AVOIDS, DDL_PLATFORM_AVOIDS, DDL_CACHE, DDL_AVOID_PINS] as const;
