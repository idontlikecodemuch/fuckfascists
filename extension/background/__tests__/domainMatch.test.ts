import { findByDomain } from '../domainMatch';
import type { Entity } from '../../../core/models';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeEntity(overrides: Partial<Entity> = {}): Entity {
  return {
    id: 'e1',
    canonicalName: 'Acme Corp',
    aliases: [],
    domains: ['acme.com', 'www.acme.com', 'shop.acme.com'],
    categoryTags: [],
    ceoName: 'Jane Doe',
    verificationStatus: 'unverified',
    lastVerifiedDate: '2024-01-01',
    ...overrides,
  };
}

const ENTITIES: Entity[] = [
  makeEntity({ id: 'acme',   canonicalName: 'Acme',   domains: ['acme.com', 'www.acme.com', 'shop.acme.com'] }),
  makeEntity({ id: 'amazon', canonicalName: 'Amazon', domains: ['amazon.com', 'smile.amazon.com', 'www.amazon.com'] }),
  makeEntity({ id: 'walmart', canonicalName: 'Walmart', domains: ['walmart.com', 'www.walmart.com'] }),
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('findByDomain', () => {
  it('matches an exact apex domain', () => {
    const result = findByDomain('amazon.com', ENTITIES);
    expect(result?.id).toBe('amazon');
  });

  it('matches an explicit www. subdomain', () => {
    const result = findByDomain('www.amazon.com', ENTITIES);
    expect(result?.id).toBe('amazon');
  });

  it('matches a non-www subdomain listed in the entity', () => {
    const result = findByDomain('smile.amazon.com', ENTITIES);
    expect(result?.id).toBe('amazon');
  });

  it('strips www. and matches apex when only apex is in the list', () => {
    // If entity only has 'walmart.com' (no www), www.walmart.com should still match via stripping
    const entities: Entity[] = [makeEntity({ id: 'wm', canonicalName: 'WM', domains: ['walmart.com'] })];
    const result = findByDomain('www.walmart.com', entities);
    expect(result?.id).toBe('wm');
  });

  it('returns null for an unlisted domain', () => {
    expect(findByDomain('example.com', ENTITIES)).toBeNull();
  });

  it('returns null for an empty entity list', () => {
    expect(findByDomain('amazon.com', [])).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(findByDomain('AMAZON.COM', ENTITIES)?.id).toBe('amazon');
    expect(findByDomain('WWW.Amazon.COM', ENTITIES)?.id).toBe('amazon');
  });

  it('matches the first entity when multiple could match', () => {
    const entities: Entity[] = [
      makeEntity({ id: 'first',  domains: ['shared.com'] }),
      makeEntity({ id: 'second', domains: ['shared.com'] }),
    ];
    expect(findByDomain('shared.com', entities)?.id).toBe('first');
  });

  it('returns null for an empty hostname', () => {
    expect(findByDomain('', ENTITIES)).toBeNull();
  });
});
