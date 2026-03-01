import { getCache, setCache, isCacheExpired, makeCacheDeps } from '../cacheStore';
import type { StorageAdapter } from '../adapters';
import type { LocalCache } from '../../models';
import { ENTITY_CACHE_TTL_DAYS } from '../../../config/constants';

// ─── Mock adapter ─────────────────────────────────────────────────────────────

function makeAdapter(
  overrides: Partial<StorageAdapter> = {}
): jest.Mocked<StorageAdapter> {
  return {
    getCacheEntry: jest.fn().mockResolvedValue(null),
    setCacheEntry: jest.fn().mockResolvedValue(undefined),
    upsertEntityAvoid: jest.fn().mockResolvedValue(undefined),
    getEntityAvoids: jest.fn().mockResolvedValue([]),
    upsertPlatformAvoid: jest.fn().mockResolvedValue(undefined),
    getPlatformAvoids: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as jest.Mocked<StorageAdapter>;
}

const mockSummary = {
  orgName: 'Walmart Inc',
  orgId: 'D000000074',
  total: 5_000_000,
  dems: 1_500_000,
  repubs: 3_000_000,
  lobbying: 500_000,
  sourceUrl: 'https://www.opensecrets.org/orgs/summary?id=D000000074',
  cycle: '2024',
};

const freshEntry: LocalCache = {
  key: 'walmart',
  openSecretsOrgId: 'D000000074',
  donationSummary: mockSummary,
  confidence: 'HIGH',
  fetchedAt: Date.now(),
};

// ─── isCacheExpired ───────────────────────────────────────────────────────────

describe('isCacheExpired', () => {
  it('returns false for a freshly fetched entry', () => {
    expect(isCacheExpired(Date.now())).toBe(false);
  });

  it('returns true when the entry is older than TTL', () => {
    const ttlMs = ENTITY_CACHE_TTL_DAYS * 24 * 60 * 60 * 1_000;
    const expiredAt = Date.now() - ttlMs - 1_000;
    expect(isCacheExpired(expiredAt)).toBe(true);
  });

  it('returns false for an entry exactly at the TTL boundary', () => {
    const ttlMs = ENTITY_CACHE_TTL_DAYS * 24 * 60 * 60 * 1_000;
    // One millisecond before expiry — still valid
    const justValid = Date.now() - ttlMs + 1_000;
    expect(isCacheExpired(justValid)).toBe(false);
  });
});

// ─── getCache ─────────────────────────────────────────────────────────────────

describe('getCache', () => {
  it('returns a fresh cache entry from the adapter', async () => {
    const adapter = makeAdapter({
      getCacheEntry: jest.fn().mockResolvedValue(freshEntry),
    });

    const result = await getCache(adapter, 'walmart');
    expect(result).toBe(freshEntry);
    expect(adapter.getCacheEntry).toHaveBeenCalledWith('walmart');
  });

  it('returns null when the adapter has no entry for the key', async () => {
    const adapter = makeAdapter();
    const result = await getCache(adapter, 'unknown');
    expect(result).toBeNull();
  });

  it('returns null for an expired entry (treats it as a cache miss)', async () => {
    const expired: LocalCache = { ...freshEntry, fetchedAt: 0 };
    const adapter = makeAdapter({
      getCacheEntry: jest.fn().mockResolvedValue(expired),
    });

    const result = await getCache(adapter, 'walmart');
    expect(result).toBeNull();
  });
});

// ─── setCache ─────────────────────────────────────────────────────────────────

describe('setCache', () => {
  it('writes the entry to the adapter', async () => {
    const adapter = makeAdapter();
    await setCache(adapter, freshEntry);
    expect(adapter.setCacheEntry).toHaveBeenCalledWith(freshEntry);
  });
});

// ─── makeCacheDeps ────────────────────────────────────────────────────────────

describe('makeCacheDeps', () => {
  it('getCache returns a valid entry from the adapter', async () => {
    const adapter = makeAdapter({
      getCacheEntry: jest.fn().mockResolvedValue(freshEntry),
    });
    const deps = makeCacheDeps(adapter);

    const result = await deps.getCache('walmart');
    expect(result).toBe(freshEntry);
  });

  it('getCache returns null for an expired entry', async () => {
    const expired: LocalCache = { ...freshEntry, fetchedAt: 0 };
    const adapter = makeAdapter({
      getCacheEntry: jest.fn().mockResolvedValue(expired),
    });
    const deps = makeCacheDeps(adapter);

    expect(await deps.getCache('walmart')).toBeNull();
  });

  it('setCache writes to the adapter', async () => {
    const adapter = makeAdapter();
    const deps = makeCacheDeps(adapter);

    await deps.setCache(freshEntry);
    expect(adapter.setCacheEntry).toHaveBeenCalledWith(freshEntry);
  });

  it('getCache and setCache are compatible with MatchingDeps shape', () => {
    const adapter = makeAdapter();
    const deps = makeCacheDeps(adapter);

    // Type-level check: these must be assignable to the MatchingDeps signatures
    expect(typeof deps.getCache).toBe('function');
    expect(typeof deps.setCache).toBe('function');
  });
});
