import type { EntityAvoidEvent, LocalCache, PlatformAvoidEvent } from '../models';

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
   * Records that the user avoided a platform during the given week.
   * weekOf is the Monday of that week in YYYY-MM-DD format.
   */
  upsertPlatformAvoid(event: PlatformAvoidEvent): Promise<void>;

  /** Returns all platform avoid events, optionally filtered by weekOf. */
  getPlatformAvoids(weekOf?: string): Promise<PlatformAvoidEvent[]>;
}
