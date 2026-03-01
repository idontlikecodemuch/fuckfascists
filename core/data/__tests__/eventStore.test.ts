import {
  recordEntityAvoid,
  recordPlatformAvoid,
  getAllEntityAvoids,
  getPlatformAvoidsForWeek,
  toDateString,
  getMondayOf,
} from '../eventStore';
import type { StorageAdapter } from '../adapters';
import type { EntityAvoidEvent, PlatformAvoidEvent } from '../../models';

// ─── Mock adapter ─────────────────────────────────────────────────────────────

function makeAdapter(
  overrides: Partial<StorageAdapter> = {}
): jest.Mocked<StorageAdapter> {
  return {
    getCacheEntry: jest.fn().mockResolvedValue(null),
    setCacheEntry: jest.fn().mockResolvedValue(undefined),
    upsertEntityAvoid: jest.fn().mockResolvedValue(undefined),
    getEntityAvoids: jest.fn().mockResolvedValue([]),
    upsertPlatformAvoid: jest.fn().mockResolvedValue(undefined),
    getPlatformAvoids: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as jest.Mocked<StorageAdapter>;
}

// ─── toDateString ─────────────────────────────────────────────────────────────

describe('toDateString', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(toDateString(new Date('2024-03-15T12:00:00Z'))).toBe('2024-03-15');
  });

  it('uses UTC date, not local time', () => {
    // Midnight UTC is still March 15 in UTC regardless of local TZ
    expect(toDateString(new Date('2024-03-15T00:00:00Z'))).toBe('2024-03-15');
  });
});

// ─── getMondayOf ──────────────────────────────────────────────────────────────

describe('getMondayOf', () => {
  it('returns the same day when the input is Monday', () => {
    expect(getMondayOf(new Date('2024-03-11T00:00:00Z'))).toBe('2024-03-11');
  });

  it('returns the previous Monday for a mid-week date', () => {
    expect(getMondayOf(new Date('2024-03-13T00:00:00Z'))).toBe('2024-03-11'); // Wednesday → Monday
  });

  it('returns the previous Monday for Sunday', () => {
    expect(getMondayOf(new Date('2024-03-17T00:00:00Z'))).toBe('2024-03-11'); // Sunday → previous Monday
  });

  it('returns the correct Monday for Saturday', () => {
    expect(getMondayOf(new Date('2024-03-16T00:00:00Z'))).toBe('2024-03-11'); // Saturday
  });
});

// ─── recordEntityAvoid ────────────────────────────────────────────────────────

describe('recordEntityAvoid', () => {
  it('inserts a new avoid event with count 1 when none exists today', async () => {
    const adapter = makeAdapter();
    await recordEntityAvoid(adapter, 'walmart');

    expect(adapter.upsertEntityAvoid).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: 'walmart', count: 1 })
    );
  });

  it('increments count when an avoid event already exists today', async () => {
    const today = toDateString(new Date());
    const existing: EntityAvoidEvent = { entityId: 'walmart', date: today, count: 3 };
    const adapter = makeAdapter({
      getEntityAvoids: jest.fn().mockResolvedValue([existing]),
    });

    await recordEntityAvoid(adapter, 'walmart');

    expect(adapter.upsertEntityAvoid).toHaveBeenCalledWith(
      expect.objectContaining({ entityId: 'walmart', date: today, count: 4 })
    );
  });

  it('does not increment when the existing event is from a different day', async () => {
    const yesterday: EntityAvoidEvent = { entityId: 'walmart', date: '2000-01-01', count: 5 };
    const adapter = makeAdapter({
      getEntityAvoids: jest.fn().mockResolvedValue([yesterday]),
    });

    await recordEntityAvoid(adapter, 'walmart');

    expect(adapter.upsertEntityAvoid).toHaveBeenCalledWith(
      expect.objectContaining({ count: 1 })
    );
  });

  it('queries only events for the given entityId', async () => {
    const adapter = makeAdapter();
    await recordEntityAvoid(adapter, 'target');

    expect(adapter.getEntityAvoids).toHaveBeenCalledWith('target');
  });
});

// ─── getAllEntityAvoids ────────────────────────────────────────────────────────

describe('getAllEntityAvoids', () => {
  it('returns all events from the adapter', async () => {
    const events: EntityAvoidEvent[] = [
      { entityId: 'walmart', date: '2024-03-11', count: 2 },
      { entityId: 'target', date: '2024-03-12', count: 1 },
    ];
    const adapter = makeAdapter({ getEntityAvoids: jest.fn().mockResolvedValue(events) });

    const result = await getAllEntityAvoids(adapter);
    expect(result).toEqual(events);
    expect(adapter.getEntityAvoids).toHaveBeenCalledWith(); // no filter
  });
});

// ─── recordPlatformAvoid ──────────────────────────────────────────────────────

describe('recordPlatformAvoid', () => {
  it('records an avoid event for the current week', async () => {
    const adapter = makeAdapter();
    await recordPlatformAvoid(adapter, 'twitter');

    const expectedWeek = getMondayOf(new Date());
    expect(adapter.upsertPlatformAvoid).toHaveBeenCalledWith({
      platformId: 'twitter',
      weekOf: expectedWeek,
    });
  });
});

// ─── getPlatformAvoidsForWeek ─────────────────────────────────────────────────

describe('getPlatformAvoidsForWeek', () => {
  it('uses the provided weekOf', async () => {
    const events: PlatformAvoidEvent[] = [{ platformId: 'twitter', weekOf: '2024-03-11' }];
    const adapter = makeAdapter({ getPlatformAvoids: jest.fn().mockResolvedValue(events) });

    const result = await getPlatformAvoidsForWeek(adapter, '2024-03-11');
    expect(result).toEqual(events);
    expect(adapter.getPlatformAvoids).toHaveBeenCalledWith('2024-03-11');
  });

  it('defaults to the current week when weekOf is omitted', async () => {
    const adapter = makeAdapter();
    await getPlatformAvoidsForWeek(adapter);

    const expectedWeek = getMondayOf(new Date());
    expect(adapter.getPlatformAvoids).toHaveBeenCalledWith(expectedWeek);
  });
});
