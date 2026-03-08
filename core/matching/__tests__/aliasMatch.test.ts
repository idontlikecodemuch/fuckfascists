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
  matchScore: 1.0,
  lastVerifiedDate: '2024-01-01',
};

const mcdonalds: Entity = {
  id: 'mcdonalds',
  canonicalName: "McDonald's Corporation",
  aliases: ["McDonald's", 'McDonalds'],
  domains: ['mcdonalds.com'],
  categoryTags: ['food'],
  ceoName: 'Chris Kempczinski',
  lastVerifiedDate: '2024-01-01',
};

const entities: Entity[] = [walmart, mcdonalds];

describe('findByAlias', () => {
  it('matches by canonical name (normalized)', () => {
    expect(findByAlias(normalize('Walmart Inc'), entities)).toBe(walmart);
  });

  it('matches by alias (normalized)', () => {
    expect(findByAlias(normalize('Walmart'), entities)).toBe(walmart);
    expect(findByAlias(normalize('Wal-Mart'), entities)).toBe(walmart);
    expect(findByAlias(normalize('Walmart Supercenter'), entities)).toBe(walmart);
  });

  it("matches possessive canonical name (McDonald's)", () => {
    expect(findByAlias(normalize("McDonald's"), entities)).toBe(mcdonalds);
    expect(findByAlias(normalize('McDonalds'), entities)).toBe(mcdonalds);
  });

  it('returns null when no match found', () => {
    expect(findByAlias(normalize('Costco'), entities)).toBeNull();
  });

  it('is case-insensitive via normalize', () => {
    expect(findByAlias(normalize('WALMART'), entities)).toBe(walmart);
    expect(findByAlias(normalize('walmart supercenter'), entities)).toBe(walmart);
  });
});
