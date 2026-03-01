import type { LocalCache } from '../models';
import type { StorageAdapter } from './adapters';
import { ENTITY_CACHE_TTL_DAYS } from '../../config/constants';

/**
 * Returns a valid (non-expired) cache entry for `key`, or null.
 * Expired entries are treated the same as absent entries — the caller
 * will re-fetch from OpenSecrets and overwrite.
 *
 * Satisfies the `getCache` side of MatchingDeps.
 */
export async function getCache(
  adapter: StorageAdapter,
  key: string
): Promise<LocalCache | null> {
  const entry = await adapter.getCacheEntry(key);
  if (!entry) return null;
  return isCacheExpired(entry.fetchedAt) ? null : entry;
}

/**
 * Writes a cache entry to the adapter.
 * Satisfies the `setCache` side of MatchingDeps.
 */
export async function setCache(
  adapter: StorageAdapter,
  entry: LocalCache
): Promise<void> {
  await adapter.setCacheEntry(entry);
}

/** Returns true when the entry is older than ENTITY_CACHE_TTL_DAYS. */
export function isCacheExpired(fetchedAt: number): boolean {
  const ttlMs = ENTITY_CACHE_TTL_DAYS * 24 * 60 * 60 * 1_000;
  return Date.now() - fetchedAt > ttlMs;
}

/**
 * Builds the cache portion of MatchingDeps bound to a concrete adapter.
 *
 * Usage:
 *   const deps: MatchingDeps = {
 *     entities,
 *     fetchOrgs:      client.getOrgs.bind(client),
 *     fetchOrgSummary: client.getOrgSummary.bind(client),
 *     ...makeCacheDeps(adapter),
 *   };
 */
export function makeCacheDeps(adapter: StorageAdapter): {
  getCache: (key: string) => Promise<LocalCache | null>;
  setCache: (entry: LocalCache) => Promise<void>;
} {
  return {
    getCache: (key) => getCache(adapter, key),
    setCache: (entry) => setCache(adapter, entry),
  };
}
