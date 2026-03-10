import { ChromeStorageAdapter } from '../ChromeStorageAdapter';
import type { EntityAvoidEvent, LocalCache, PlatformAvoidEvent } from '../../../core/models';

// ─── chrome.storage.local mock ───────────────────────────────────────────────

const store: Record<string, unknown> = {};

const chromeMock = {
  storage: {
    local: {
      get: jest.fn(async (key: string | string[] | null) => {
        if (key === null) return { ...store };
        if (typeof key === 'string') return { [key]: store[key] };
        return Object.fromEntries((key as string[]).map((k) => [k, store[k]]));
      }),
      set: jest.fn(async (items: Record<string, unknown>) => {
        Object.assign(store, items);
      }),
    },
  },
};

(global as unknown as Record<string, unknown>).chrome = chromeMock;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clearStore() {
  Object.keys(store).forEach((k) => delete store[k]);
  jest.clearAllMocks();
  // Re-attach so mock implementation uses the cleared store
  chromeMock.storage.local.get.mockImplementation(async (key: string | string[] | null) => {
    if (key === null) return { ...store };
    if (typeof key === 'string') return { [key]: store[key] };
    return Object.fromEntries((key as string[]).map((k) => [k, store[k]]));
  });
  chromeMock.storage.local.set.mockImplementation(async (items: Record<string, unknown>) => {
    Object.assign(store, items);
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ChromeStorageAdapter', () => {
  let adapter: ChromeStorageAdapter;

  beforeEach(() => {
    clearStore();
    adapter = new ChromeStorageAdapter();
  });

  // ── Cache ──────────────────────────────────────────────────────────────────

  describe('getCacheEntry', () => {
    it('returns null when key is absent', async () => {
      expect(await adapter.getCacheEntry('missing')).toBeNull();
    });

    it('returns the entry after setCacheEntry', async () => {
      const entry: LocalCache = {
        key: 'test-key',
        fecCommitteeId: 'org123',
        donationSummary: {
          committeeId: 'org123', committeeName: 'Acme', recentCycle: 2024,
          recentRepubs: 900, recentDems: 100,
          totalRepubs: 900, totalDems: 100,
          activeCycles: [2024], raw: [], lastUpdated: '2024-01-01',
          fecCommitteeUrl: 'https://www.fec.gov/data/committee/org123/',
        },
        confidence: 1.0,
        fetchedAt: Date.now(),
      };
      await adapter.setCacheEntry(entry);
      const result = await adapter.getCacheEntry('test-key');
      expect(result).toEqual(entry);
    });
  });

  // ── Entity avoid events ────────────────────────────────────────────────────

  describe('upsertEntityAvoid', () => {
    it('inserts a new event with count 1', async () => {
      const event: EntityAvoidEvent = { entityId: 'e1', date: '2024-03-11', count: 1 };
      await adapter.upsertEntityAvoid(event);
      const results = await adapter.getEntityAvoids('e1');
      expect(results).toHaveLength(1);
      expect(results[0].count).toBe(1);
    });

    it('increments count on a second call for the same (entityId, date)', async () => {
      const event: EntityAvoidEvent = { entityId: 'e1', date: '2024-03-11', count: 1 };
      await adapter.upsertEntityAvoid(event);
      await adapter.upsertEntityAvoid(event);
      const results = await adapter.getEntityAvoids('e1');
      expect(results[0].count).toBe(2);
    });

    it('keeps separate entries for different dates', async () => {
      await adapter.upsertEntityAvoid({ entityId: 'e1', date: '2024-03-11', count: 1 });
      await adapter.upsertEntityAvoid({ entityId: 'e1', date: '2024-03-12', count: 1 });
      const results = await adapter.getEntityAvoids('e1');
      expect(results).toHaveLength(2);
    });
  });

  describe('getEntityAvoids', () => {
    it('returns all entity avoids when no entityId filter', async () => {
      await adapter.upsertEntityAvoid({ entityId: 'e1', date: '2024-03-11', count: 1 });
      await adapter.upsertEntityAvoid({ entityId: 'e2', date: '2024-03-11', count: 1 });
      const results = await adapter.getEntityAvoids();
      expect(results).toHaveLength(2);
    });

    it('filters by entityId when provided', async () => {
      await adapter.upsertEntityAvoid({ entityId: 'e1', date: '2024-03-11', count: 1 });
      await adapter.upsertEntityAvoid({ entityId: 'e2', date: '2024-03-11', count: 1 });
      const results = await adapter.getEntityAvoids('e1');
      expect(results).toHaveLength(1);
      expect(results[0].entityId).toBe('e1');
    });

    it('returns empty array when no events exist', async () => {
      expect(await adapter.getEntityAvoids()).toEqual([]);
    });
  });

  // ── Platform avoid events ──────────────────────────────────────────────────

  describe('upsertPlatformAvoid', () => {
    it('stores a platform avoid event', async () => {
      const event: PlatformAvoidEvent = { platformId: 'twitter', weekOf: '2024-03-11' };
      await adapter.upsertPlatformAvoid(event);
      const results = await adapter.getPlatformAvoids('2024-03-11');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(event);
    });

    it('is idempotent — second upsert does not create a duplicate', async () => {
      const event: PlatformAvoidEvent = { platformId: 'twitter', weekOf: '2024-03-11' };
      await adapter.upsertPlatformAvoid(event);
      await adapter.upsertPlatformAvoid(event);
      const results = await adapter.getPlatformAvoids('2024-03-11');
      expect(results).toHaveLength(1);
    });
  });

  describe('getPlatformAvoids', () => {
    it('returns all platform avoids when no weekOf filter', async () => {
      await adapter.upsertPlatformAvoid({ platformId: 'twitter', weekOf: '2024-03-11' });
      await adapter.upsertPlatformAvoid({ platformId: 'facebook', weekOf: '2024-03-18' });
      const results = await adapter.getPlatformAvoids();
      expect(results).toHaveLength(2);
    });

    it('filters by weekOf when provided', async () => {
      await adapter.upsertPlatformAvoid({ platformId: 'twitter', weekOf: '2024-03-11' });
      await adapter.upsertPlatformAvoid({ platformId: 'facebook', weekOf: '2024-03-18' });
      const results = await adapter.getPlatformAvoids('2024-03-11');
      expect(results).toHaveLength(1);
      expect(results[0].platformId).toBe('twitter');
    });
  });
});
