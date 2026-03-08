/**
 * SQLite DDL for the local database.
 * Used by the mobile app's SqliteAdapter — not imported by the browser extension.
 *
 * Privacy reminder: coordinates and browsing history are NEVER stored.
 * Only affirmative avoidance actions are recorded — there is no "support" table.
 */

export const TABLE_ENTITY_AVOIDS = 'entity_avoid_events';
export const TABLE_PLATFORM_AVOIDS = 'platform_avoid_events';
export const TABLE_CACHE = 'cache';

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
    PRIMARY KEY (entity_id, date)
  );
`;

/**
 * platform_avoid_events
 * One record per (platform_id, week_of) — idempotent upsert.
 * week_of is the Monday of the week in YYYY-MM-DD format.
 */
export const DDL_PLATFORM_AVOIDS = `
  CREATE TABLE IF NOT EXISTS ${TABLE_PLATFORM_AVOIDS} (
    platform_id TEXT NOT NULL,
    week_of     TEXT NOT NULL,
    PRIMARY KEY (platform_id, week_of)
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

/** Ordered list of all DDL statements — run in sequence to initialize the DB. */
export const ALL_DDL = [DDL_ENTITY_AVOIDS, DDL_PLATFORM_AVOIDS, DDL_CACHE] as const;
