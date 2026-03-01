import { generateReportCard, nextMondayOf } from '../utils/generateReportCard';
import type { StorageAdapter } from '../../../core/data';
import type { Entity } from '../../../core/models';
import type { Platform } from '../../Survey/types';
import type { EntityAvoidEvent, PlatformAvoidEvent } from '../../../core/models';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const WEEK = '2024-03-11'; // Monday

const walmart: Entity = {
  id: 'walmart', canonicalName: 'Walmart Inc', aliases: [],
  domains: [], categoryTags: [], ceoName: 'Doug McMillon', lastVerifiedDate: '2024-01-01',
};
const target: Entity = {
  id: 'target', canonicalName: 'Target Corp', aliases: [],
  domains: [], categoryTags: [], ceoName: 'Brian Cornell', lastVerifiedDate: '2024-01-01',
};

const twitter: Platform = {
  id: 'twitter', name: 'Twitter / X', parentCompany: 'X Corp',
  ceoName: 'Linda Yaccarino', categoryTags: ['social'],
};

function makeAdapter(
  entityEvents: EntityAvoidEvent[] = [],
  platformEvents: PlatformAvoidEvent[] = []
): jest.Mocked<StorageAdapter> {
  return {
    getCacheEntry:      jest.fn().mockResolvedValue(null),
    setCacheEntry:      jest.fn().mockResolvedValue(undefined),
    upsertEntityAvoid:  jest.fn().mockResolvedValue(undefined),
    getEntityAvoids:    jest.fn().mockResolvedValue(entityEvents),
    upsertPlatformAvoid: jest.fn().mockResolvedValue(undefined),
    getPlatformAvoids:  jest.fn().mockResolvedValue(platformEvents),
  } as jest.Mocked<StorageAdapter>;
}

// ─── nextMondayOf ─────────────────────────────────────────────────────────────

describe('nextMondayOf', () => {
  it('returns the Monday 7 days after the given Monday', () => {
    expect(nextMondayOf('2024-03-11')).toBe('2024-03-18');
  });

  it('handles month boundaries', () => {
    expect(nextMondayOf('2024-03-25')).toBe('2024-04-01');
  });
});

// ─── generateReportCard ───────────────────────────────────────────────────────

describe('generateReportCard', () => {
  it('returns zero totals when there are no events', async () => {
    const card = await generateReportCard(makeAdapter(), [], [], WEEK, false);
    expect(card.totalEntityAvoids).toBe(0);
    expect(card.totalPlatformAvoids).toBe(0);
    expect(card.entityAvoids).toHaveLength(0);
    expect(card.platformAvoids).toHaveLength(0);
  });

  it('includes entity avoids within the week', async () => {
    const events: EntityAvoidEvent[] = [
      { entityId: 'walmart', date: '2024-03-11', count: 2 },
      { entityId: 'walmart', date: '2024-03-13', count: 1 },
    ];
    const card = await generateReportCard(makeAdapter(events), [walmart], [], WEEK, false);
    expect(card.entityAvoids).toHaveLength(1);
    expect(card.entityAvoids[0].count).toBe(3); // summed
    expect(card.entityAvoids[0].name).toBe('Walmart Inc');
    expect(card.entityAvoids[0].ceoName).toBe('Doug McMillon');
  });

  it('excludes entity avoids outside the week', async () => {
    const events: EntityAvoidEvent[] = [
      { entityId: 'walmart', date: '2024-03-10', count: 5 }, // Sunday before
      { entityId: 'walmart', date: '2024-03-18', count: 5 }, // following Monday
    ];
    const card = await generateReportCard(makeAdapter(events), [walmart], [], WEEK, false);
    expect(card.entityAvoids).toHaveLength(0);
  });

  it('sorts entity avoids by count descending', async () => {
    const events: EntityAvoidEvent[] = [
      { entityId: 'walmart', date: '2024-03-11', count: 1 },
      { entityId: 'target',  date: '2024-03-11', count: 5 },
    ];
    const card = await generateReportCard(makeAdapter(events), [walmart, target], [], WEEK, false);
    expect(card.entityAvoids[0].entityId).toBe('target');
    expect(card.entityAvoids[1].entityId).toBe('walmart');
  });

  it('falls back to entityId as name when entity is not in the list', async () => {
    const events: EntityAvoidEvent[] = [{ entityId: 'unknown-org', date: '2024-03-11', count: 1 }];
    const card = await generateReportCard(makeAdapter(events), [], [], WEEK, false);
    expect(card.entityAvoids[0].name).toBe('unknown-org');
  });

  it('maps platform avoids to display names', async () => {
    const platformEvents: PlatformAvoidEvent[] = [{ platformId: 'twitter', weekOf: WEEK }];
    const card = await generateReportCard(makeAdapter([], platformEvents), [], [twitter], WEEK, false);
    expect(card.platformAvoids).toEqual(['Twitter / X']);
    expect(card.totalPlatformAvoids).toBe(1);
  });

  it('falls back to platformId when platform is not in the list', async () => {
    const platformEvents: PlatformAvoidEvent[] = [{ platformId: 'unknown-platform', weekOf: WEEK }];
    const card = await generateReportCard(makeAdapter([], platformEvents), [], [], WEEK, false);
    expect(card.platformAvoids).toEqual(['unknown-platform']);
  });

  it('passes weekOf and isPreview through to the result', async () => {
    const card = await generateReportCard(makeAdapter(), [], [], WEEK, true);
    expect(card.weekOf).toBe(WEEK);
    expect(card.isPreview).toBe(true);
  });

  it('computes totalEntityAvoids as the sum across all entities', async () => {
    const events: EntityAvoidEvent[] = [
      { entityId: 'walmart', date: '2024-03-11', count: 3 },
      { entityId: 'target',  date: '2024-03-12', count: 2 },
    ];
    const card = await generateReportCard(makeAdapter(events), [walmart, target], [], WEEK, false);
    expect(card.totalEntityAvoids).toBe(5);
  });
});
