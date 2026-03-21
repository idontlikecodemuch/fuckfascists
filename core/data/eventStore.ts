import type { EntityAvoidEvent, PlatformAvoidEvent } from '../models';
import type { StorageAdapter } from './adapters';
import { getLocalDateString, getLocalWeekStart } from '../utils/localDate';

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
  const date = getLocalDateString();
  // count: 1 is a placeholder — the DB owns the increment atomically (ON CONFLICT DO UPDATE SET count = count + 1).
  await adapter.upsertEntityAvoid({ entityId, date, count: 1 });
}

/** Returns all stored entity avoid events — used for scorecard generation. */
export async function getAllEntityAvoids(
  adapter: StorageAdapter
): Promise<EntityAvoidEvent[]> {
  return adapter.getEntityAvoids();
}

// ── Platform avoid events ──────────────────────────────────────────────────────

/**
 * Records an affirmative avoidance of a tracked platform.
 * If the user already avoided this platform today, the count is incremented.
 *
 * IMPORTANT: Only avoidance is recorded. There is no "support" path.
 * No time component or location is stored — date only (YYYY-MM-DD).
 */
export async function recordPlatformAvoid(
  adapter: StorageAdapter,
  platformId: string
): Promise<boolean> {
  const date = getLocalDateString();
  return recordPlatformAvoidForDate(adapter, platformId, date);
}

/**
 * Records an affirmative avoidance of a tracked platform for a specific date.
 * Used by the day-circle UI to log avoids for past days in the current week.
 *
 * IMPORTANT: Only avoidance is recorded. There is no "support" path.
 * Date is YYYY-MM-DD — no time component or location stored.
 */
export async function recordPlatformAvoidForDate(
  adapter: StorageAdapter,
  platformId: string,
  date: string
): Promise<boolean> {
  const existingEvents = await adapter.getPlatformAvoids(platformId);
  const alreadyLogged = existingEvents.some((event) => event.date === date && event.count > 0);
  if (alreadyLogged) return false;

  await adapter.upsertPlatformAvoid({ platformId, date, count: 1 });
  return true;
}

/**
 * Returns the total avoid count for a single platform during the given week.
 * Sums all daily counts from Monday through Sunday. Defaults to current week.
 */
export async function getPlatformWeeklyTotal(
  adapter: StorageAdapter,
  platformId: string,
  weekOf?: string
): Promise<number> {
  const weekStart = weekOf ?? getLocalWeekStart();
  const weekEnd = nextMondayOfStr(weekStart);
  const events = normalizePlatformAvoidEvents(
    await adapter.getPlatformAvoidsForWeek(weekStart, weekEnd),
  );
  return events
    .filter((e) => e.platformId === platformId)
    .reduce((sum, e) => sum + e.count, 0);
}

/**
 * Returns a map of platformId → total weekly avoid count for all platforms.
 * Used by the Platforms screen to show per-platform tallies.
 */
export async function getAllPlatformWeeklyTotals(
  adapter: StorageAdapter,
  weekOf?: string
): Promise<Map<string, number>> {
  const weekStart = weekOf ?? getLocalWeekStart();
  const weekEnd = nextMondayOfStr(weekStart);
  const events = normalizePlatformAvoidEvents(
    await adapter.getPlatformAvoidsForWeek(weekStart, weekEnd),
  );
  const totals = new Map<string, number>();
  for (const e of events) {
    totals.set(e.platformId, (totals.get(e.platformId) ?? 0) + e.count);
  }
  return totals;
}

/**
 * Returns all platform avoid events for a given week.
 * Used by scorecard generation. Defaults to current week.
 */
export async function getPlatformAvoidsForWeek(
  adapter: StorageAdapter,
  weekOf?: string
): Promise<PlatformAvoidEvent[]> {
  const weekStart = weekOf ?? getLocalWeekStart();
  const weekEnd = nextMondayOfStr(weekStart);
  return normalizePlatformAvoidEvents(
    await adapter.getPlatformAvoidsForWeek(weekStart, weekEnd),
  );
}

/** Returns the Monday immediately following the given weekOf date string. */
function nextMondayOfStr(weekOf: string): string {
  const d = new Date(`${weekOf}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

function normalizePlatformAvoidEvents(events: PlatformAvoidEvent[]): PlatformAvoidEvent[] {
  const deduped = new Map<string, PlatformAvoidEvent>();

  for (const event of events) {
    if (event.count <= 0) continue;
    const key = `${event.platformId}:${event.date}`;
    if (deduped.has(key)) continue;
    deduped.set(key, { ...event, count: 1 });
  }

  return Array.from(deduped.values());
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/**
 * Returns a Date as YYYY-MM-DD using UTC.
 * For computing new event dates use getLocalDateString() from core/utils/localDate.ts
 * instead. This helper is retained for pure transformations (e.g. test assertions,
 * boundary arithmetic on stored date strings).
 */
export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns the Monday of the given date's ISO week as YYYY-MM-DD using UTC.
 * For computing the current week key for new event writes use getLocalWeekStart()
 * from core/utils/localDate.ts instead. This helper is retained for pure
 * transformations on existing Date values.
 */
export function getMondayOf(date: Date): string {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}
