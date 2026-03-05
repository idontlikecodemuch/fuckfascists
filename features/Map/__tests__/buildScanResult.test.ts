import { buildScanResult } from '../utils/buildScanResult';
import type { MatchSuccess } from '../../../core/matching';
import type { Entity, DonationSummary } from '../../../core/models';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const walmartEntity: Entity = {
  id: 'walmart',
  canonicalName: 'Walmart Inc',
  aliases: ['Walmart'],
  domains: ['walmart.com'],
  categoryTags: ['retail'],
  ceoName: 'Doug McMillon',
  openSecretsOrgId: 'D000000074',
  matchScore: 1.0,
  lastVerifiedDate: '2024-01-01',
};

const mockSummary: DonationSummary = {
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

function makeMatch(overrides: Partial<MatchSuccess> = {}): MatchSuccess {
  return {
    matched: true,
    entity: walmartEntity,
    confidence: 'HIGH',
    openSecretsOrgId: 'D000000074',
    donationSummary: mockSummary,
    fromCache: false,
    ...overrides,
  };
}

// ─── buildScanResult ──────────────────────────────────────────────────────────

describe('buildScanResult', () => {
  it('maps entity id and canonicalName from the curated entity', () => {
    const result = buildScanResult(makeMatch());
    expect(result.entityId).toBe('walmart');
    expect(result.canonicalName).toBe('Walmart Inc');
  });

  it('uses openSecretsOrgId as canonicalName fallback when entity is null', () => {
    const result = buildScanResult(
      makeMatch({ entity: null, openSecretsOrgId: 'D000000999' })
    );
    expect(result.entityId).toBeNull();
    expect(result.canonicalName).toBe('D000000999');
  });

  it('propagates entityId as null when entity is null', () => {
    const result = buildScanResult(makeMatch({ entity: null }));
    expect(result.entityId).toBeNull();
  });

  it('copies confidence level from the match', () => {
    expect(buildScanResult(makeMatch({ confidence: 'HIGH' })).confidence).toBe('HIGH');
    expect(buildScanResult(makeMatch({ confidence: 'MEDIUM' })).confidence).toBe('MEDIUM');
  });

  it('copies donationSummary reference unchanged', () => {
    const result = buildScanResult(makeMatch());
    expect(result.donationSummary).toBe(mockSummary);
  });

  it('copies openSecretsOrgId', () => {
    const result = buildScanResult(makeMatch({ openSecretsOrgId: 'D000000074' }));
    expect(result.openSecretsOrgId).toBe('D000000074');
  });

  it('copies entity reference unchanged', () => {
    const result = buildScanResult(makeMatch());
    expect(result.entity).toBe(walmartEntity);
  });

  it('returns null entity when match has no entity', () => {
    const result = buildScanResult(makeMatch({ entity: null }));
    expect(result.entity).toBeNull();
  });
});
