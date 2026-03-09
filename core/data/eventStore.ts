import type { EntityAvoidEvent, PlatformAvoidEvent } from '../models';
import type { StorageAdapter } from './adapters';

// ── Entity avoid events ────────────────────────────────────────────────────────

/**
 * Records an affirmative avoidance of a flagged business.
 * If the user already avoided this entity today, the count is incremented.
 *
 * IMPORTANT: Only avoidance is recorded. There is no "support" path.
 * No time component or location is stored — date only (YYYY-MM-DD).
 */
export async function recordEntityAvoid(
  adapter: StorageAdapter,
  entityId: string
): Promise<void> {
  const date = toDateString(new Date());
  // count: 1 is a placeholder — the DB owns the increment atomically (ON CONFLICT DO UPDATE SET count = count + 1).
  await adapter.upsertEntityAvoid({ entityId, date, count: 1 });
}

/** Returns all stored entity avoid events — used for report card generation. */
export async function getAllEntityAvoids(
  adapter: StorageAdapter
): Promise<EntityAvoidEvent[]> {
  return adapter.getEntityAvoids();
}

// ── Platform avoid events ──────────────────────────────────────────────────────

/**
 * Records that the user avoided a platform during the current week.
 * Idempotent — safe to call multiple times for the same (platformId, week).
 */
export async function recordPlatformAvoid(
  adapter: StorageAdapter,
  platformId: string
): Promise<void> {
  const weekOf = getMondayOf(new Date());
  await adapter.upsertPlatformAvoid({ platformId, weekOf });
}

/**
 * Returns platform avoid events for a given week.
 * Defaults to the current week when weekOf is omitted.
 */
export async function getPlatformAvoidsForWeek(
  adapter: StorageAdapter,
  weekOf?: string
): Promise<PlatformAvoidEvent[]> {
  const target = weekOf ?? getMondayOf(new Date());
  return adapter.getPlatformAvoids(target);
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Returns a date as YYYY-MM-DD (UTC, no time component). */
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Returns the Monday of the given date's ISO week as YYYY-MM-DD (UTC). */
export function getMondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
