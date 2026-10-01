import { getScorecardAvoidPurgeCutoff } from '../avoidRetention';
import { purgeOldAvoidEvents } from '../../../../core/data';
import { computeDropTime } from '../../../../core/dropSchedule/computeDropTime';
import { getLocalWeekStartForDate } from '../../../../core/utils/localDate';
import { aggregateScorecard } from '../../data/aggregateScorecard';
import { getScorecardDropTimeForTimestamp } from '../dropTime';
import type { StorageAdapter } from '../../../../core/data';
import type { Entity, EntityAvoidEvent, PlatformAvoidEvent } from '../../../../core/models';

const scoredWeek = '2026-05-23';
const afterDropStartup = new Date('2026-05-30T10:00:00-04:00');

const meta: Entity = {
  id: 'meta',
  canonicalName: 'Meta Platforms',
  aliases: ['Meta'],
  domains: ['meta.com'],
  categoryTags: ['social'],
  ceoName: 'Mark Zuckerberg',
  verificationStatus: 'manual',
  lastVerifiedDate: '2026-05-01',
};

function makeMutableAdapter(entityEvents: EntityAvoidEvent[]): jest.Mocked<StorageAdapter> {
  let entities = [...entityEvents];
  const platformEvents: PlatformAvoidEvent[] = [];

  return {
    getCacheEntry: jest.fn().mockResolvedValue(null),
    setCacheEntry: jest.fn().mockResolvedValue(undefined),
    upsertEntityAvoid: jest.fn().mockResolvedValue(undefined),
    getEntityAvoids: jest.fn(async () => entities),
    upsertPlatformAvoid: jest.fn().mockResolvedValue(undefined),
    getPlatformAvoids: jest.fn(async () => platformEvents),
    deletePlatformAvoidForDate: jest.fn().mockResolvedValue(undefined),
    getPlatformAvoidsForWeek: jest.fn(async (start: string, end: string) =>
      platformEvents.filter((event) => event.date >= start && event.date < end),
    ),
    clearAllPlatformAvoids: jest.fn().mockResolvedValue(undefined),
    upsertAvoidPin: jest.fn().mockResolvedValue(undefined),
    getAvoidPinsForDate: jest.fn().mockResolvedValue([]),
    getEntityAvoidsForDate: jest.fn().mockResolvedValue([]),
    clearOldAvoidPins: jest.fn().mockResolvedValue(undefined),
    clearOldEntityAvoids: jest.fn(async (beforeDate: string) => {
      entities = entities.filter((event) => event.date >= beforeDate);
    }),
    clearOldPlatformAvoids: jest.fn().mockResolvedValue(undefined),
    clearEntityAvoidsInRange: jest.fn().mockResolvedValue(undefined),
    clearPlatformAvoidsInRange: jest.fn().mockResolvedValue(undefined),
  } as jest.Mocked<StorageAdapter>;
}

function findLateSaturdayDrop(): Date {
  for (let year = 2026; year <= 2028; year++) {
    for (let week = 1; week <= 53; week++) {
      const drop = computeDropTime(year, week);
      if (drop.getUTCDay() === 6 && drop.getUTCHours() >= 20) return drop;
    }
  }
  throw new Error('no late Saturday drop fixture found');
}

describe('getScorecardAvoidPurgeCutoff', () => {
  it('keeps normal startup cleanup on the live Sat-Fri week before rollover', () => {
    expect(getScorecardAvoidPurgeCutoff(new Date('2026-05-27T12:00:00-04:00')))
      .toBe('2026-05-23');
  });

  it('preserves the just-finished scored week after Saturday local rollover', () => {
    expect(getScorecardAvoidPurgeCutoff(new Date('2026-05-30T10:00:00-04:00')))
      .toBe('2026-05-23');
  });

  it('returns to normal cleanup after the next ISO drop week starts', () => {
    expect(getScorecardAvoidPurgeCutoff(new Date('2026-06-01T12:00:00-04:00')))
      .toBe('2026-05-30');
  });

  it('keeps a late Saturday drop active after the ISO week rolls to Monday', () => {
    const lateSaturdayDrop = findLateSaturdayDrop();
    const mondayInsideWindow = new Date(lateSaturdayDrop.getTime() + 36 * 60 * 60 * 1000);

    expect(getScorecardDropTimeForTimestamp(mondayInsideWindow.getTime()).getTime())
      .toBe(lateSaturdayDrop.getTime());
    expect(getScorecardAvoidPurgeCutoff(mondayInsideWindow))
      .toBe(getLocalWeekStartForDate(new Date(lateSaturdayDrop.getTime() - 24 * 60 * 60 * 1000)));
  });

  it('prevents startup cleanup from erasing the pending scored week before capture', async () => {
    const events: EntityAvoidEvent[] = [
      { entityId: 'meta', date: '2026-05-22', count: 1 },
      { entityId: 'meta', date: '2026-05-29', count: 2 },
    ];

    const oldCutoffAdapter = makeMutableAdapter(events);
    await purgeOldAvoidEvents(oldCutoffAdapter, getLocalWeekStartForDate(afterDropStartup));
    const oldResult = await aggregateScorecard(oldCutoffAdapter, [meta], [], scoredWeek);

    const retainedAdapter = makeMutableAdapter(events);
    await purgeOldAvoidEvents(retainedAdapter, getScorecardAvoidPurgeCutoff(afterDropStartup));
    const retainedResult = await aggregateScorecard(retainedAdapter, [meta], [], scoredWeek);

    expect(oldResult).toEqual([]);
    expect(retainedResult).toHaveLength(1);
    expect(retainedResult[0].figureName).toBe('Mark Zuckerberg');
    expect(retainedResult[0].totalCount).toBe(2);
  });
});
