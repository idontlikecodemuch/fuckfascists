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
  openSecretsOrgId: 'D000000074',
  matchScore: 1.0,
  lastVerifiedDate: '2024-01-01',
};

const entityWithoutOrgId: Entity = {
  id: 'localcoffee',
  canonicalName: 'Local Coffee Co',
  aliases: ['Local Coffee'],
  domains: [],
  categoryTags: ['food'],
  ceoName: 'Jane Doe',
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
  lastUpdated:     '2024-01-01',
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
      openSecretsOrgId: 'D000000074',
      donationSummary: mockDonationSummary,
      confidence: 'HIGH',
      fetchedAt: Date.now(),
    };
    const deps = makeDeps({ getCache: jest.fn().mockResolvedValue(cached) });

    const result = await matchEntity('Walmart', deps);

    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.fromCache).toBe(true);
      expect(result.confidence).toBe('HIGH');
      expect(result.entity).toBe(walmartEntity);
    }
    expect(deps.fetchOrgs).not.toHaveBeenCalled();
    expect(deps.fetchOrgSummary).not.toHaveBeenCalled();
  });

  it('ignores expired cache and falls through to alias match', async () => {
    const expired: LocalCache = {
      key: 'walmart',
      openSecretsOrgId: 'D000000074',
      donationSummary: mockDonationSummary,
      confidence: 'HIGH',
      fetchedAt: 0, // epoch — definitely expired
    };
    const deps = makeDeps({ getCache: jest.fn().mockResolvedValue(expired) });

    const result = await matchEntity('Walmart', deps);

    // Should re-resolve via alias match and call orgSummary
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
      expect(result.confidence).toBe('HIGH');
      expect(result.entity).toBe(walmartEntity);
      expect(result.openSecretsOrgId).toBe('D000000074');
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
        openSecretsOrgId: 'D000000074',
        confidence: 'HIGH',
      })
    );
  });

  it('resolves orgId via API when entity lacks openSecretsOrgId', async () => {
    const deps = makeDeps({
      entities: [entityWithoutOrgId],
      fetchOrgs: jest
        .fn()
        .mockResolvedValue([{ orgid: 'D000000999', orgname: 'Local Coffee Co' }]),
    });

    const result = await matchEntity('Local Coffee', deps);

    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.openSecretsOrgId).toBe('D000000999');
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

// ─── Fuzzy (OpenSecrets) match ────────────────────────────────────────────────

describe('fuzzy match', () => {
  it('returns HIGH confidence when best score clears the high threshold', async () => {
    const deps = makeDeps({
      entities: [],
      fetchOrgs: jest
        .fn()
        .mockResolvedValue([{ orgid: 'D000000074', orgname: 'Walmart Inc' }]),
    });

    const result = await matchEntity('Walmart', deps);

    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.confidence).toBe('HIGH');
      expect(result.openSecretsOrgId).toBe('D000000074');
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

  it('returns MatchFailure when OpenSecrets returns no results', async () => {
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
      expect.objectContaining({ openSecretsOrgId: 'D000000074' })
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
      expect(result.confidence).toBe('HIGH');
    }
    // Jaro-Winkler would only be called via fetchOrgs → scoreAll; it must not be called
    expect(deps.fetchOrgs).not.toHaveBeenCalled();
  });

  it('returns MEDIUM confidence when matchScore is 0.75', async () => {
    const mediumEntity: Entity = {
      ...walmartEntity,
      id: 'medium-test',
      matchScore: 0.75,
    };
    const deps = makeDeps({ entities: [mediumEntity] });

    const result = await matchEntity('Walmart', deps);

    expect(result.matched).toBe(true);
    if (result.matched) {
      expect(result.confidence).toBe('MEDIUM');
    }
    expect(deps.fetchOrgs).not.toHaveBeenCalled();
  });

  it('returns MatchFailure when matchScore is below the MEDIUM threshold', async () => {
    const lowScoreEntity: Entity = {
      ...walmartEntity,
      id: 'low-score-test',
      matchScore: 0.4,
    };
    const deps = makeDeps({ entities: [lowScoreEntity] });

    const result = await matchEntity('Walmart', deps);

    expect(result.matched).toBe(false);
  });
});
