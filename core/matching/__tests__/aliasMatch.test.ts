import { findByAlias } from '../aliasMatch';
import { normalize } from '../normalize';
import type { Entity } from '../../models';

const walmart: Entity = {
  id: 'walmart',
  canonicalName: 'Walmart Inc',
  aliases: ['Walmart', 'Wal-Mart', 'Walmart Supercenter'],
  domains: ['walmart.com'],
  categoryTags: ['retail'],
  ceoName: 'Doug McMillon',
  fecCommitteeId: 'D000000074',
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2024-01-01',
};

const mcdonalds: Entity = {
  id: 'mcdonalds',
  canonicalName: "McDonald's Corporation",
  aliases: ["McDonald's", 'McDonalds'],
  domains: ['mcdonalds.com'],
  categoryTags: ['food'],
  ceoName: 'Chris Kempczinski',
  verificationStatus: 'unverified',
  lastVerifiedDate: '2024-01-01',
};

const entities: Entity[] = [walmart, mcdonalds];

describe('findByAlias', () => {
  it('matches by canonical name (normalized)', () => {
    const hit = findByAlias(normalize('Walmart Inc'), entities);
    expect(hit?.entity).toBe(walmart);
    expect(hit?.matchedAlias).toBe('Walmart Inc');
  });

  it('matches by alias (normalized)', () => {
    expect(findByAlias(normalize('Walmart'), entities)).toEqual({ entity: walmart, matchedAlias: 'Walmart' });
    // normalize('Wal-Mart') → 'walmart' matches normalize('Walmart') → alias 'Walmart'
    expect(findByAlias(normalize('Wal-Mart'), entities)).toEqual({ entity: walmart, matchedAlias: 'Walmart' });
    expect(findByAlias(normalize('Walmart Supercenter'), entities)).toEqual({ entity: walmart, matchedAlias: 'Walmart Supercenter' });
  });

  it("matches possessive canonical name (McDonald's)", () => {
    // normalize("McDonald's") → 'mcdonalds' matches alias "McDonald's" (not canonicalName 'mcdonalds corporation')
    expect(findByAlias(normalize("McDonald's"), entities)).toEqual({ entity: mcdonalds, matchedAlias: "McDonald's" });
    expect(findByAlias(normalize('McDonalds'), entities)).toEqual({ entity: mcdonalds, matchedAlias: "McDonald's" });
  });

  it('returns null when no match found', () => {
    expect(findByAlias(normalize('Costco'), entities)).toBeNull();
  });

  it('is case-insensitive via normalize', () => {
    expect(findByAlias(normalize('WALMART'), entities)?.entity).toBe(walmart);
    expect(findByAlias(normalize('walmart supercenter'), entities)?.entity).toBe(walmart);
  });
});
