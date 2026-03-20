import { aggregateScorecard, verbForCategory } from '../aggregateScorecard';
import type { StorageAdapter } from '../../../../core/data';
import type { Entity, EntityAvoidEvent, PlatformAvoidEvent } from '../../../../core/models';
import type { Platform } from '../../../Platforms/types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const WEEK = '2024-03-11'; // Monday

const walmart: Entity = {
  id: 'walmart', canonicalName: 'Walmart Inc', aliases: ['Walmart'],
  domains: ['walmart.com'], categoryTags: ['retailer', 'grocery'],
  ceoName: 'Doug McMillon', verificationStatus: 'manual', lastVerifiedDate: '2024-01-01',
};

const amazon: Entity = {
  id: 'amazon', canonicalName: 'Amazon.com Inc', aliases: ['Amazon'],
  domains: ['amazon.com'], categoryTags: ['ecommerce'],
  ceoName: 'Andy Jassy', publicFigureName: 'Jeff Bezos',
  verificationStatus: 'manual', lastVerifiedDate: '2024-01-01',
};

const meta: Entity = {
  id: 'meta', canonicalName: 'Meta Platforms', aliases: ['Meta'],
  domains: ['meta.com'], categoryTags: ['social'],
  ceoName: 'Mark Zuckerberg',
  verificationStatus: 'manual', lastVerifiedDate: '2024-01-01',
};

const instagram: Entity = {
  id: 'instagram-entity', canonicalName: 'Instagram LLC', aliases: ['Instagram'],
  domains: ['instagram.com'], categoryTags: ['social'],
  ceoName: 'Adam Mosseri', parentEntityId: 'meta',
  verificationStatus: 'manual', lastVerifiedDate: '2024-01-01',
};

const noTagsEntity: Entity = {
  id: 'generic-corp', canonicalName: 'Generic Corp', aliases: ['Generic'],
  domains: [], categoryTags: [],
  ceoName: 'Jane Doe', verificationStatus: 'unverified', lastVerifiedDate: '2024-01-01',
};

const instagramPlatform: Platform = {
  id: 'instagram', name: 'Instagram', parentCompany: 'Meta Platforms',
  ceoName: 'Mark Zuckerberg', categoryTags: ['social'],
};

const facebookPlatform: Platform = {
  id: 'facebook', name: 'Facebook', parentCompany: 'Meta Platforms',
  ceoName: 'Mark Zuckerberg', categoryTags: ['social'],
};

const amazonPlatform: Platform = {
  id: 'amazon-shop', name: 'Amazon', parentCompany: 'Amazon.com Inc',
  ceoName: 'Andy Jassy', categoryTags: ['shopping', 'streaming'],
};

const allEntities = [walmart, amazon, meta, instagram, noTagsEntity];

// ─── Mock adapter ─────────────────────────────────────────────────────────────

function makeAdapter(
  entityEvents: EntityAvoidEvent[] = [],
  platformEvents: PlatformAvoidEvent[] = [],
): jest.Mocked<StorageAdapter> {
  return {
    getCacheEntry:            jest.fn().mockResolvedValue(null),
    setCacheEntry:            jest.fn().mockResolvedValue(undefined),
    upsertEntityAvoid:        jest.fn().mockResolvedValue(undefined),
    getEntityAvoids:          jest.fn().mockResolvedValue(entityEvents),
    upsertPlatformAvoid:      jest.fn().mockResolvedValue(undefined),
    getPlatformAvoids:        jest.fn().mockResolvedValue(platformEvents),
    getPlatformAvoidsForWeek: jest.fn().mockResolvedValue(platformEvents),
    clearAllPlatformAvoids:   jest.fn().mockResolvedValue(undefined),
  } as jest.Mocked<StorageAdapter>;
}

// ─── verbForCategory ──────────────────────────────────────────────────────────

describe('verbForCategory', () => {
  it('returns "stayed off" for social', () => {
    expect(verbForCategory(['social'])).toBe('stayed off');
  });

  it('returns "stayed off" for platform', () => {
    expect(verbForCategory(['platform'])).toBe('stayed off');
  });

  it('returns "stayed off" for messaging', () => {
    expect(verbForCategory(['messaging'])).toBe('stayed off');
  });

  it('returns "skipped" for ecommerce', () => {
    expect(verbForCategory(['ecommerce'])).toBe('skipped');
  });

  it('returns "skipped" for streaming', () => {
    expect(verbForCategory(['streaming'])).toBe('skipped');
  });

  it('returns "skipped" for shopping', () => {
    expect(verbForCategory(['shopping'])).toBe('skipped');
  });

  it('returns "walked past" for retailer', () => {
    expect(verbForCategory(['retailer'])).toBe('walked past');
  });

  it('returns "walked past" for restaurant', () => {
    expect(verbForCategory(['restaurant'])).toBe('walked past');
  });

  it('returns "walked past" for grocery', () => {
    expect(verbForCategory(['grocery'])).toBe('walked past');
  });

  it('returns "avoided" when no tags match', () => {
    expect(verbForCategory([])).toBe('avoided');
    expect(verbForCategory(['unknown'])).toBe('avoided');
  });

  it('uses the first matching tag when multiple are present', () => {
    // ['retailer', 'grocery'] → first match is 'retailer' → "walked past"
    expect(verbForCategory(['retailer', 'grocery'])).toBe('walked past');
    // ['social', 'streaming'] → first match is 'social' → "stayed off"
    expect(verbForCategory(['social', 'streaming'])).toBe('stayed off');
    // ['streaming', 'social'] → first match is 'streaming' → "skipped"
    expect(verbForCategory(['streaming', 'social'])).toBe('skipped');
  });
});

// ─── aggregateScorecard ───────────────────────────────────────────────────────

describe('aggregateScorecard', () => {
  it('returns empty array when no events exist', async () => {
    const result = await aggregateScorecard(makeAdapter(), allEntities, [], WEEK);
    expect(result).toEqual([]);
  });

  it('returns one person with one source for a single entity avoid', async () => {
    const events: EntityAvoidEvent[] = [
      { entityId: 'walmart', date: '2024-03-12', count: 3 },
    ];
    const result = await aggregateScorecard(makeAdapter(events), allEntities, [], WEEK);
    expect(result).toHaveLength(1);
    expect(result[0].figureName).toBe('Doug McMillon');
    expect(result[0].totalCount).toBe(3);
    expect(result[0].sources).toHaveLength(1);
    expect(result[0].sources[0]).toEqual({
      name: 'Walmart',
      count: 3,
      verb: 'walked past',
    });
  });

  it('uses publicFigureName when present, ceoName as fallback', async () => {
    const entityEvents: EntityAvoidEvent[] = [
      { entityId: 'amazon', date: '2024-03-11', count: 1 },
      { entityId: 'walmart', date: '2024-03-11', count: 1 },
    ];
    const result = await aggregateScorecard(makeAdapter(entityEvents), allEntities, [], WEEK);
    const amazonPerson = result.find((p) => p.figureName === 'Jeff Bezos');
    const walmartPerson = result.find((p) => p.figureName === 'Doug McMillon');
    expect(amazonPerson).toBeDefined();
    expect(walmartPerson).toBeDefined();
  });

  it('merges multiple entities under the same person via parentEntityId', async () => {
    // instagram has parentEntityId: 'meta' → ladders up to Zuckerberg
    const entityEvents: EntityAvoidEvent[] = [
      { entityId: 'meta', date: '2024-03-11', count: 2 },
      { entityId: 'instagram-entity', date: '2024-03-12', count: 3 },
    ];
    const result = await aggregateScorecard(makeAdapter(entityEvents), allEntities, [], WEEK);
    const zuck = result.find((p) => p.figureName === 'Mark Zuckerberg');
    expect(zuck).toBeDefined();
    expect(zuck!.totalCount).toBe(5);
    expect(zuck!.sources).toHaveLength(2);
    // Sources should be Meta and Instagram
    const sourceNames = zuck!.sources.map((s) => s.name).sort();
    expect(sourceNames).toEqual(['Instagram', 'Meta']);
  });

  it('merges platform avoids under the same person as entity avoids', async () => {
    // Both entity 'meta' and platform 'instagram' → Zuckerberg
    const entityEvents: EntityAvoidEvent[] = [
      { entityId: 'meta', date: '2024-03-11', count: 1 },
    ];
    const platformEvents: PlatformAvoidEvent[] = [
      { platformId: 'instagram', date: '2024-03-11', count: 4 },
    ];
    const result = await aggregateScorecard(
      makeAdapter(entityEvents, platformEvents),
      allEntities,
      [instagramPlatform],
      WEEK,
    );
    const zuck = result.find((p) => p.figureName === 'Mark Zuckerberg');
    expect(zuck).toBeDefined();
    expect(zuck!.totalCount).toBe(5);
    expect(zuck!.sources).toHaveLength(2);
  });

  it('merges multiple platforms under the same person', async () => {
    // Instagram + Facebook both → Zuckerberg
    const platformEvents: PlatformAvoidEvent[] = [
      { platformId: 'instagram', date: '2024-03-11', count: 3 },
      { platformId: 'facebook', date: '2024-03-12', count: 2 },
    ];
    const result = await aggregateScorecard(
      makeAdapter([], platformEvents),
      allEntities,
      [instagramPlatform, facebookPlatform],
      WEEK,
    );
    expect(result).toHaveLength(1);
    expect(result[0].figureName).toBe('Mark Zuckerberg');
    expect(result[0].totalCount).toBe(5);
    expect(result[0].sources).toHaveLength(2);
    const ig = result[0].sources.find((s) => s.name === 'Instagram');
    const fb = result[0].sources.find((s) => s.name === 'Facebook');
    expect(ig).toEqual({ name: 'Instagram', count: 3, verb: 'stayed off' });
    expect(fb).toEqual({ name: 'Facebook', count: 2, verb: 'stayed off' });
  });

  it('sorts descending by totalCount', async () => {
    const entityEvents: EntityAvoidEvent[] = [
      { entityId: 'walmart', date: '2024-03-11', count: 2 },
      { entityId: 'amazon', date: '2024-03-11', count: 10 },
    ];
    const platformEvents: PlatformAvoidEvent[] = [
      { platformId: 'instagram', date: '2024-03-11', count: 5 },
    ];
    const result = await aggregateScorecard(
      makeAdapter(entityEvents, platformEvents),
      allEntities,
      [instagramPlatform],
      WEEK,
    );
    expect(result).toHaveLength(3);
    expect(result[0].figureName).toBe('Jeff Bezos');       // 10
    expect(result[1].figureName).toBe('Mark Zuckerberg');  // 5
    expect(result[2].figureName).toBe('Doug McMillon');    // 2
  });

  it('excludes entity avoids outside the week', async () => {
    const events: EntityAvoidEvent[] = [
      { entityId: 'walmart', date: '2024-03-10', count: 5 }, // Sunday before
      { entityId: 'walmart', date: '2024-03-18', count: 5 }, // following Monday
    ];
    const result = await aggregateScorecard(makeAdapter(events), allEntities, [], WEEK);
    expect(result).toEqual([]);
  });

  it('sums entity avoid counts across multiple days within the week', async () => {
    const events: EntityAvoidEvent[] = [
      { entityId: 'walmart', date: '2024-03-11', count: 2 },
      { entityId: 'walmart', date: '2024-03-13', count: 3 },
      { entityId: 'walmart', date: '2024-03-15', count: 1 },
    ];
    const result = await aggregateScorecard(makeAdapter(events), allEntities, [], WEEK);
    expect(result).toHaveLength(1);
    expect(result[0].totalCount).toBe(6);
    expect(result[0].sources[0].count).toBe(6);
  });

  it('sums platform avoid counts across multiple days', async () => {
    const platformEvents: PlatformAvoidEvent[] = [
      { platformId: 'instagram', date: '2024-03-11', count: 1 },
      { platformId: 'instagram', date: '2024-03-12', count: 1 },
      { platformId: 'instagram', date: '2024-03-13', count: 1 },
    ];
    const result = await aggregateScorecard(
      makeAdapter([], platformEvents),
      allEntities,
      [instagramPlatform],
      WEEK,
    );
    expect(result).toHaveLength(1);
    expect(result[0].totalCount).toBe(3);
  });

  it('assigns correct verb based on categoryTags', async () => {
    const entityEvents: EntityAvoidEvent[] = [
      { entityId: 'walmart', date: '2024-03-11', count: 1 },  // retailer → "walked past"
      { entityId: 'amazon', date: '2024-03-11', count: 1 },   // ecommerce → "skipped"
      { entityId: 'meta', date: '2024-03-11', count: 1 },     // social → "stayed off"
      { entityId: 'generic-corp', date: '2024-03-11', count: 1 }, // [] → "avoided"
    ];
    const result = await aggregateScorecard(makeAdapter(entityEvents), allEntities, [], WEEK);
    const find = (name: string) => result.find((p) => p.figureName === name);
    expect(find('Doug McMillon')!.sources[0].verb).toBe('walked past');
    expect(find('Jeff Bezos')!.sources[0].verb).toBe('skipped');
    expect(find('Mark Zuckerberg')!.sources[0].verb).toBe('stayed off');
    expect(find('Jane Doe')!.sources[0].verb).toBe('avoided');
  });

  it('uses first alias as display name when available', async () => {
    const events: EntityAvoidEvent[] = [
      { entityId: 'amazon', date: '2024-03-11', count: 1 },
    ];
    const result = await aggregateScorecard(makeAdapter(events), allEntities, [], WEEK);
    expect(result[0].sources[0].name).toBe('Amazon'); // aliases[0], not canonicalName
  });

  it('falls back to canonicalName when aliases is empty', async () => {
    const noAliasEntity: Entity = {
      id: 'no-alias', canonicalName: 'No Alias Corp', aliases: [],
      domains: [], categoryTags: [], ceoName: 'Bob',
      verificationStatus: 'unverified', lastVerifiedDate: '2024-01-01',
    };
    const events: EntityAvoidEvent[] = [
      { entityId: 'no-alias', date: '2024-03-11', count: 1 },
    ];
    const result = await aggregateScorecard(
      makeAdapter(events), [...allEntities, noAliasEntity], [], WEEK,
    );
    const bob = result.find((p) => p.figureName === 'Bob');
    expect(bob!.sources[0].name).toBe('No Alias Corp');
  });

  it('falls back to entityId when entity is not in the list', async () => {
    const events: EntityAvoidEvent[] = [
      { entityId: 'unknown-org', date: '2024-03-11', count: 1 },
    ];
    const result = await aggregateScorecard(makeAdapter(events), allEntities, [], WEEK);
    expect(result).toHaveLength(1);
    expect(result[0].figureName).toBe('unknown-org');
    expect(result[0].sources[0].name).toBe('unknown-org');
    expect(result[0].sources[0].verb).toBe('avoided');
  });

  it('falls back to platformId when platform is not in the list', async () => {
    const platformEvents: PlatformAvoidEvent[] = [
      { platformId: 'unknown-platform', date: '2024-03-11', count: 2 },
    ];
    const result = await aggregateScorecard(makeAdapter([], platformEvents), allEntities, [], WEEK);
    expect(result).toHaveLength(1);
    expect(result[0].figureName).toBe('unknown-platform');
    expect(result[0].sources[0].name).toBe('unknown-platform');
    expect(result[0].sources[0].verb).toBe('avoided');
  });

  it('assigns verb from platform categoryTags for platform avoids', async () => {
    const platformEvents: PlatformAvoidEvent[] = [
      { platformId: 'amazon-shop', date: '2024-03-11', count: 1 },
    ];
    const result = await aggregateScorecard(
      makeAdapter([], platformEvents),
      allEntities,
      [amazonPlatform],
      WEEK,
    );
    // ['shopping', 'streaming'] → first match 'shopping' → "skipped"
    expect(result[0].sources[0].verb).toBe('skipped');
  });
});
