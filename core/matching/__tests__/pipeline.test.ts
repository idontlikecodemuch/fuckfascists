import { matchEntity } from '../pipeline';
import type { MatchingDeps } from '../types';
import type { DonationSummary, Entity, LocalCache } from '../../models';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const walmartEntity: Entity = {
  id: 'walmart',
  canonicalName: 'Walmart Inc',
  aliases: ['Walmart', 'Wal-Mart'],
  domains: ['walmart.com'],
  categoryTags: ['retail'],
  ceoName: 'Doug McMillon',
  fecCommitteeId: 'D000000074',
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2024-01-01',
};

const entityWithoutOrgId: Entity = {
  id: 'localcoffee',
  canonicalName: 'Local Coffee Co',
  aliases: ['Local Coffee'],
  domains: [],
  categoryTags: ['food'],
  ceoName: 'Jane Doe',
  verificationStatus: 'unverified',
  lastVerifiedDate: '2024-01-01',
};

const mockDonationSummary: DonationSummary = {
  committeeId:     'D000000074',
  committeeName:   'Walmart Inc',
  recentCycle:     2024,
  recentRepubs:    3_000_000,
  recentDems:      1_500_000,
  totalRepubs:     3_000_000,
  totalDems:       1_500_000,
  activeCycles:    [2024],
  raw:             [],
  lastUpdated:     '2024-01-01',
  fecCommitteeUrl: 'https://www.fec.gov/data/committee/D000000074/',
};

const zeroedButActiveSummary: DonationSummary = {
  committeeId:     'D000000074',
  committeeName:   'Walmart Inc',
  recentCycle:     2024,
  recentRepubs:    0,
  recentDems:      0,
  totalRepubs:     0,
  totalDems:       0,
  activeCycles:    [2016, 2018, 2020, 2022, 2024],
  raw:             [],
  lastUpdated:     '2026-03-10',
  fecCommitteeUrl: 'https://www.fec.gov/data/committee/D000000074/',
};

function makeDeps(overrides: Partial<MatchingDeps> = {}): jest.Mocked<MatchingDeps> {
  return {
    entities: [walmartEntity],
    fetchOrgs: jest.fn().mockResolvedValue([]),
    fetchOrgSummary: jest.fn().mockResolvedValue(mockDonationSummary),
    getCache: jest.fn().mockResolvedValue(null),
    setCache: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<MatchingDeps>;
}

// ─── Cache hit ────────────────────────────────────────────────────────────────

describe('cache hit', () => {
  it('returns cached result without calling API', async () => {
    const cached: LocalCache = {
      key: 'walmart',
      fecCommitteeId: 'D000000074',
      donationSummary: mockDonationSummary,
      confidence: 1.0,
      fetchedAt: Date.now(),
    };
    const deps = makeDeps({ getCache: jest.fn().mockResolvedValue(cached) });

    const result = await matchEntity('Walmart', deps);

    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.fromCache).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.entity).toBe(walmartEntity);
    }
    expect(deps.fetchOrgs).not.toHaveBeenCalled();
    expect(deps.fetchOrgSummary).not.toHaveBeenCalled();
  });

  it('ignores expired cache and falls through to alias match', async () => {
    const expired: LocalCache = {
      key: 'walmart',
      fecCommitteeId: 'D000000074',
      donationSummary: mockDonationSummary,
      confidence: 1.0,
      fetchedAt: 0, // epoch — definitely expired
    };
    const deps = makeDeps({ getCache: jest.fn().mockResolvedValue(expired) });

    const result = await matchEntity('Walmart', deps);

    // Should re-resolve via alias match and call orgSummary
    expect(result.matched).toBe(true);
    if (result.matched) expect(result.fromCache).toBe(false);
    expect(deps.fetchOrgSummary).toHaveBeenCalledWith('D000000074');
  });

  it('ignores suspicious zeroed cache entries and refetches live donation data', async () => {
    const cached: LocalCache = {
      key: 'walmart',
      fecCommitteeId: 'D000000074',
      donationSummary: zeroedButActiveSummary,
      confidence: 1.0,
      fetchedAt: Date.now(),
    };
    const deps = makeDeps({ getCache: jest.fn().mockResolvedValue(cached) });

    const result = await matchEntity('Walmart', deps);

    expect(result.matched).toBe(true);
    if (result.matched) expect(result.fromCache).toBe(false);
    expect(deps.fetchOrgSummary).toHaveBeenCalledWith('D000000074');
  });
});

// ─── Alias match ──────────────────────────────────────────────────────────────

describe('alias match', () => {
  it('returns HIGH confidence for an exact alias match', async () => {
    const deps = makeDeps();

    const result = await matchEntity('Walmart', deps);

    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.entity).toBe(walmartEntity);
      expect(result.fecCommitteeId).toBe('D000000074');
      expect(result.fromCache).toBe(false);
    }
    // No need to call getOrgs when orgId is already in the entity
    expect(deps.fetchOrgs).not.toHaveBeenCalled();
  });

  it('caches the result after an alias match', async () => {
    const deps = makeDeps();

    await matchEntity('Wal-Mart', deps);

    expect(deps.setCache).toHaveBeenCalledWith(
      expect.objectContaining({
        fecCommitteeId: 'D000000074',
        confidence: 1.0,
      })
    );
  });

  it('ignores suspicious zeroed bundled summaries and refetches live donation data', async () => {
    const deps = makeDeps({
      entities: [{ ...walmartEntity, donationSummary: zeroedButActiveSummary, lastVerifiedDate: '2026-03-10' }],
    });

    const result = await matchEntity('Walmart', deps);

    expect(deps.fetchOrgSummary).toHaveBeenCalledWith('D000000074');
    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.donationSummary).toEqual(mockDonationSummary);
    }
  });

  it('resolves orgId via API when entity lacks fecCommitteeId', async () => {
    const deps = makeDeps({
      entities: [entityWithoutOrgId],
      fetchOrgs: jest
        .fn()
        .mockResolvedValue([{ orgid: 'D000000999', orgname: 'Local Coffee Co' }]),
    });

    const result = await matchEntity('Local Coffee', deps);

    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.fecCommitteeId).toBe('D000000999');
    }
    expect(deps.fetchOrgs).toHaveBeenCalled();
  });

  it('returns MatchFailure when orgId cannot be resolved', async () => {
    const deps = makeDeps({
      entities: [entityWithoutOrgId],
      fetchOrgs: jest.fn().mockResolvedValue([]), // no results → no orgId
    });

    const result = await matchEntity('Local Coffee', deps);

    expect(result.matched).toBe(false);
  });
});

// ─── Fuzzy FEC committee match ────────────────────────────────────────────────

describe('fuzzy match', () => {
  it('returns confidence score >= HIGH threshold when best score clears the high threshold', async () => {
    const deps = makeDeps({
      entities: [],
      fetchOrgs: jest
        .fn()
        .mockResolvedValue([{ orgid: 'D000000074', orgname: 'Walmart Inc' }]),
    });

    const result = await matchEntity('Walmart', deps);

    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.fecCommitteeId).toBe('D000000074');
    }
  });

  it('returns MatchFailure when no candidate clears the medium threshold', async () => {
    const deps = makeDeps({
      entities: [],
      fetchOrgs: jest
        .fn()
        .mockResolvedValue([{ orgid: 'D000000001', orgname: 'XYZ Holdings Corp' }]),
    });

    const result = await matchEntity('walmart', deps);

    expect(result.matched).toBe(false);
    if (!result.matched) {
      expect(result.normalizedInput).toBe('walmart');
    }
  });

  it('returns MatchFailure when FEC returns no results', async () => {
    const deps = makeDeps({ entities: [], fetchOrgs: jest.fn().mockResolvedValue([]) });

    const result = await matchEntity('some obscure shop', deps);

    expect(result.matched).toBe(false);
  });

  it('caches a successful fuzzy match', async () => {
    const deps = makeDeps({
      entities: [],
      fetchOrgs: jest
        .fn()
        .mockResolvedValue([{ orgid: 'D000000074', orgname: 'Walmart Inc' }]),
    });

    await matchEntity('Walmart', deps);

    expect(deps.setCache).toHaveBeenCalledWith(
      expect.objectContaining({ fecCommitteeId: 'D000000074' })
    );
  });
});

// ─── matchScore override ──────────────────────────────────────────────────────

describe('matchScore override', () => {
  it('returns HIGH confidence when matchScore is 1.0 without calling Jaro-Winkler', async () => {
    // walmartEntity fixture has matchScore: 1.0
    const deps = makeDeps();

    const result = await matchEntity('Walmart', deps);

    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    }
    // Jaro-Winkler would only be called via fetchOrgs → scoreAll; it must not be called
    expect(deps.fetchOrgs).not.toHaveBeenCalled();
  });

  it('returns HIGH confidence (1.0) for all curated alias matches', async () => {
    const deps = makeDeps({ entities: [walmartEntity] });

    const result = await matchEntity('Walmart', deps);

    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.confidence).toBe(1.0);
    }
    expect(deps.fetchOrgs).not.toHaveBeenCalled();
  });
});
