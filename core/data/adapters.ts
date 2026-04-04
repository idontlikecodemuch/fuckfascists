import type { AvoidPin, EntityAvoidEvent, LocalCache, PlatformAvoidEvent } from '../models';

/**
 * Platform-agnostic storage contract.
 *
 * Mobile implementation:   app/storage/SqliteAdapter.ts   (expo-sqlite)
 * Extension implementation: extension/storage/ChromeAdapter.ts (chrome.storage.local)
 *
 * All methods are async to accommodate synchronous (in-memory) and
 * asynchronous (SQLite, chrome.storage) backends in tests and production.
 */
export interface StorageAdapter {
  // ── Cache ──────────────────────────────────────────────────────────────────

  /** Returns the raw cached entry for `key`, or null if absent. */
  getCacheEntry(key: string): Promise<LocalCache | null>;

  /** Writes (or replaces) a cache entry. */
  setCacheEntry(entry: LocalCache): Promise<void>;

  // ── Entity avoid events ────────────────────────────────────────────────────

  /**
   * Inserts or increments the avoid count for (entityId, date).
   * date is YYYY-MM-DD — no time component, no location.
   */
  upsertEntityAvoid(event: EntityAvoidEvent): Promise<void>;

  /** Returns all entity avoid events, optionally filtered by entityId. */
  getEntityAvoids(entityId?: string): Promise<EntityAvoidEvent[]>;

  // ── Platform avoid events ──────────────────────────────────────────────────

  /**
   * Inserts or increments the avoid count for (platformId, date).
   * date is YYYY-MM-DD — no time component, no location.
   */
  upsertPlatformAvoid(event: PlatformAvoidEvent): Promise<void>;

  /** Returns all platform avoid events, optionally filtered by platformId. */
  getPlatformAvoids(platformId?: string): Promise<PlatformAvoidEvent[]>;

  /**
   * Returns platform avoid events whose date falls within [weekStart, weekEnd).
   * weekStart is Monday YYYY-MM-DD; weekEnd is the following Monday.
   */
  getPlatformAvoidsForWeek(weekStart: string, weekEnd: string): Promise<PlatformAvoidEvent[]>;

  /** Deletes all platform avoid events. Dev/testing only. */
  clearAllPlatformAvoids(): Promise<void>;

  // ── Avoid pins (map coordinate persistence) ───────────────────────────────

  /** Inserts or replaces an avoid pin for (entityId, date). */
  upsertAvoidPin(pin: AvoidPin): Promise<void>;

  /** Returns all avoid pins for the given date (YYYY-MM-DD). */
  getAvoidPinsForDate(date: string): Promise<AvoidPin[]>;

  /** Returns all entity avoid events for the given date (YYYY-MM-DD). */
  getEntityAvoidsForDate(date: string): Promise<EntityAvoidEvent[]>;

  /** Deletes avoid pins older than the given date. */
  clearOldAvoidPins(beforeDate: string): Promise<void>;
}
