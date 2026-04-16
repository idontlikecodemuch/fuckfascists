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

const apple: Entity = {
  id: 'apple',
  canonicalName: 'Apple Inc',
  aliases: ['Apple', 'Apple Store'],
  domains: ['apple.com'],
  categoryTags: ['tech'],
  ceoName: 'Tim Cook',
  fecCommitteeId: 'C00000001',
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2024-01-01',
};

const americanAirlines: Entity = {
  id: 'american-airlines',
  canonicalName: 'American Airlines Group Inc',
  aliases: ['American Airlines', 'American'],
  domains: ['aa.com'],
  categoryTags: ['travel'],
  ceoName: 'Robert Isom',
  fecCommitteeId: 'C00000002',
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2024-01-01',
};

const unitedAirlines: Entity = {
  id: 'united-airlines',
  canonicalName: 'United Airlines Holdings Inc',
  aliases: ['United Airlines', 'United'],
  domains: ['united.com'],
  categoryTags: ['travel'],
  ceoName: 'Scott Kirby',
  fecCommitteeId: 'C00000003',
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2024-01-01',
};

const deltaAirLines: Entity = {
  id: 'delta-air-lines',
  canonicalName: 'Delta Air Lines Inc',
  aliases: ['Delta Air Lines', 'Delta'],
  domains: ['delta.com'],
  categoryTags: ['travel'],
  ceoName: 'Ed Bastian',
  fecCommitteeId: 'C00000004',
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2024-01-01',
};

const shortCodeEntity: Entity = {
  id: 'general-motors',
  canonicalName: 'General Motors Company',
  aliases: ['General Motors', 'GM', 'Chevrolet'],
  domains: ['gm.com'],
  categoryTags: ['auto'],
  ceoName: 'Mary Barra',
  fecCommitteeId: 'C00000005',
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2024-01-01',
};

const entities: Entity[] = [
  walmart, mcdonalds, apple, americanAirlines,
  unitedAirlines, deltaAirLines, shortCodeEntity,
];

describe('findByAlias', () => {
  describe('Pass 1 — exact match', () => {
    it('matches by canonical name (normalized)', () => {
      const hit = findByAlias(normalize('Walmart Inc'), entities);
      expect(hit?.entity).toBe(walmart);
      expect(hit?.matchedAlias).toBe('Walmart Inc');
    });

    it('matches by alias (normalized)', () => {
      expect(findByAlias(normalize('Walmart'), entities)).toEqual({ entity: walmart, matchedAlias: 'Walmart' });
      expect(findByAlias(normalize('Wal-Mart'), entities)).toEqual({ entity: walmart, matchedAlias: 'Walmart' });
      expect(findByAlias(normalize('Walmart Supercenter'), entities)).toEqual({ entity: walmart, matchedAlias: 'Walmart Supercenter' });
    });

    it("matches possessive canonical name (McDonald's)", () => {
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

    it('exact-matches generic words when input is the full alias', () => {
      expect(findByAlias(normalize('American'), entities)?.entity).toBe(americanAirlines);
      expect(findByAlias(normalize('United'), entities)?.entity).toBe(unitedAirlines);
      expect(findByAlias(normalize('Delta'), entities)?.entity).toBe(deltaAirLines);
    });

    it('exact-matches multi-word aliases containing generic words', () => {
      expect(findByAlias(normalize('American Airlines'), entities)?.entity).toBe(americanAirlines);
      expect(findByAlias(normalize('United Airlines'), entities)?.entity).toBe(unitedAirlines);
      expect(findByAlias(normalize('Delta Air Lines'), entities)?.entity).toBe(deltaAirLines);
    });

    it('exact-matches short codes', () => {
      expect(findByAlias(normalize('GM'), entities)?.entity).toBe(shortCodeEntity);
    });
  });

  describe('Pass 2 — prefix match', () => {
    it('rejects single-word aliases as prefixes', () => {
      // "Apple Georgetown" — "Apple" is 1 token, blocked by multi-token guard.
      // Domain matching (iOS) or fuzzy search handles these instead.
      expect(findByAlias(normalize('Apple Georgetown'), entities)).toBeNull();
      expect(findByAlias(normalize('Apple Fifth Avenue'), entities)).toBeNull();
      expect(findByAlias(normalize('Apple Federal Credit Union'), entities)).toBeNull();
    });

    it('matches multi-word alias as prefix', () => {
      const hit = findByAlias(normalize('Apple Store SoHo'), entities);
      expect(hit?.entity).toBe(apple);
      expect(hit?.matchedAlias).toBe('Apple Store');
    });

    it('rejects suffix longer than 2 tokens', () => {
      expect(findByAlias(normalize('Apple Store Number Five Downtown'), entities)).toBeNull();
    });

    it('rejects all single-word alias prefixes — not just generic words', () => {
      // Every single-word alias is blocked from prefix matching, regardless
      // of how distinctive it seems. No blocklist — structural rule only.
      expect(findByAlias(normalize('American Association Teachers of German'), entities)).toBeNull();
      expect(findByAlias(normalize('American Medical Association'), entities)).toBeNull();
      expect(findByAlias(normalize('United Way'), entities)).toBeNull();
      expect(findByAlias(normalize('Delta Dental'), entities)).toBeNull();
    });

    it('allows multi-word alias prefix even when first word is generic', () => {
      const hit = findByAlias(normalize('American Airlines Terminal B'), entities);
      expect(hit?.entity).toBe(americanAirlines);
      expect(hit?.matchedAlias).toBe('American Airlines');
    });

    it('allows multi-word alias as prefix even from canonical name entity', () => {
      // "General Motors" (2 tokens) prefix-matches "General Motors Factory Tour"
      const hit = findByAlias(normalize('General Motors Factory Tour'), entities);
      expect(hit?.entity).toBe(shortCodeEntity);
      expect(hit?.matchedAlias).toBe('General Motors');
    });

    it('does not prefix-match when input equals alias (exact match handles it)', () => {
      expect(findByAlias(normalize('Apple'), entities)?.entity).toBe(apple);
      expect(findByAlias(normalize('Apple'), entities)?.matchedAlias).toBe('Apple');
    });
  });
});
