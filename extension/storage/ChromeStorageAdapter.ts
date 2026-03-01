import type { StorageAdapter } from '../../core/data/adapters';
import type { EntityAvoidEvent, LocalCache, PlatformAvoidEvent } from '../../core/models';

// ─── Key helpers ──────────────────────────────────────────────────────────────

const CACHE_KEY   = (k: string) => `cache:${k}`;
const ENTITY_KEY  = (id: string, date: string) => `avoid:entity:${id}:${date}`;
const PLATFORM_KEY = (id: string, week: string) => `avoid:platform:${id}:${week}`;

// ─── Prefix constants for bulk reads ─────────────────────────────────────────

const ENTITY_PREFIX   = 'avoid:entity:';
const PLATFORM_PREFIX = 'avoid:platform:';

/**
 * Implements the shared StorageAdapter contract using chrome.storage.local.
 *
 * chrome.storage.local is synchronous-like (no SQL transactions) but keys are
 * namespaced with explicit prefixes to avoid collisions with other extensions or
 * future storage keys.
 *
 * All writes are fire-and-forget on key isolation (no transactions needed).
 * Entity avoid events use an upsert pattern: read → increment → write.
 */
export class ChromeStorageAdapter implements StorageAdapter {

  // ── Cache ───────────────────────────────────────────────────────────────────

  async getCacheEntry(key: string): Promise<LocalCache | null> {
    const storageKey = CACHE_KEY(key);
    const result = await chrome.storage.local.get(storageKey);
    return (result[storageKey] as LocalCache) ?? null;
  }

  async setCacheEntry(entry: LocalCache): Promise<void> {
    await chrome.storage.local.set({ [CACHE_KEY(entry.key)]: entry });
  }

  // ── Entity avoid events ──────────────────────────────────────────────────────

  async upsertEntityAvoid(event: EntityAvoidEvent): Promise<void> {
    const storageKey = ENTITY_KEY(event.entityId, event.date);
    const existing = await chrome.storage.local.get(storageKey);
    const prev = (existing[storageKey] as EntityAvoidEvent) ?? null;
    const updated: EntityAvoidEvent = {
      entityId: event.entityId,
      date: event.date,
      count: (prev?.count ?? 0) + event.count,
    };
    await chrome.storage.local.set({ [storageKey]: updated });
  }

  async getEntityAvoids(entityId?: string): Promise<EntityAvoidEvent[]> {
    const all = await chrome.storage.local.get(null);
    return Object.entries(all)
      .filter(([k]) => {
        if (!k.startsWith(ENTITY_PREFIX)) return false;
        if (entityId) return k.startsWith(`${ENTITY_PREFIX}${entityId}:`);
        return true;
      })
      .map(([, v]) => v as EntityAvoidEvent);
  }

  // ── Platform avoid events ────────────────────────────────────────────────────

  async upsertPlatformAvoid(event: PlatformAvoidEvent): Promise<void> {
    const storageKey = PLATFORM_KEY(event.platformId, event.weekOf);
    await chrome.storage.local.set({ [storageKey]: event });
  }

  async getPlatformAvoids(weekOf?: string): Promise<PlatformAvoidEvent[]> {
    const all = await chrome.storage.local.get(null);
    return Object.entries(all)
      .filter(([k]) => {
        if (!k.startsWith(PLATFORM_PREFIX)) return false;
        if (weekOf) return k.includes(`:${weekOf}`);
        return true;
      })
      .map(([, v]) => v as PlatformAvoidEvent);
  }
}
