jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///docs/',
  getInfoAsync: jest.fn(),
  readDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
jest.mock('expo-notifications', () => ({}));

import type { StorageAdapter } from '../../../../core/data';
import type { Entity, EntityAvoidEvent, PlatformAvoidEvent } from '../../../../core/models';
import type { Platform } from '../../../Platforms/types';
import { SCORECARD_PRESENTATION_WINDOW_MS } from '../../../../config/constants';
import { getDropAtForScoredWeek } from '../../utils/scoredWeek';
import {
  capturePendingScorecards,
  listAvoidEventWeeks,
  resolveDropAtForWeek,
  type CapturePendingInput,
} from '../pendingCaptures';

const HOUR_MS = 60 * 60 * 1000;

const meta: Entity = {
  id: 'meta', canonicalName: 'Meta Platforms', aliases: ['Meta'],
  domains: ['meta.com'], categoryTags: ['social'], ceoName: 'Mark Zuckerberg',
  verificationStatus: 'manual', lastVerifiedDate: '2026-01-01',
};

const instagram: Platform = {
  id: 'instagram', name: 'Instagram', entityId: 'meta',
  parentCompany: 'Meta Platforms', ceoName: 'Mark Zuckerberg',
  categoryTags: ['social'], sortOrder: 1, defaultSelected: true,
};

function makeAdapter(entityEvents: EntityAvoidEvent[], platformEvents: PlatformAvoidEvent[] = []) {
  const store = { entity: [...entityEvents], platform: [...platformEvents] };
  const outside = (start: string, end: string) =>
    (event: { date: string }) => event.date < start || event.date >= end;

  const adapter = {
    getEntityAvoids: jest.fn(async () => store.entity),
    getPlatformAvoids: jest.fn(async () => store.platform),
    getPlatformAvoidsForWeek: jest.fn(async (start: string, end: string) =>
      store.platform.filter((event) => event.date >= start && event.date < end)),
    clearEntityAvoidsInRange: jest.fn(async (start: string, end: string) => {
      store.entity = store.entity.filter(outside(start, end));
    }),
    clearPlatformAvoidsInRange: jest.fn(async (start: string, end: string) => {
      store.platform = store.platform.filter(outside(start, end));
    }),
  } as unknown as jest.Mocked<StorageAdapter>;

  return { adapter, store };
}

function setup(
  events: EntityAvoidEvent[],
  overrides: Partial<CapturePendingInput> & { archived?: string[] } = {},
) {
  const { adapter, store } = makeAdapter(events);
  const archived = new Set(overrides.archived ?? []);
  const captureWeek = jest.fn(async (weekOf: string) => {
    archived.add(weekOf);
    return true;
  });
  const deps = {
    captureWeek,
    findCard: jest.fn(async (weekOf: string) =>
      archived.has(weekOf) ? { filename: `${weekOf}.jpg`, uri: `file://${weekOf}.jpg`, modificationTime: 1 } : null),
    markLateCard: jest.fn(async () => undefined),
    cancelDropNotification: jest.fn(async () => undefined),
    windowWeek: null,
    ...overrides,
  };
  const run = (nowMs: number) => capturePendingScorecards({
    adapter, entities: [meta], platforms: [instagram], nowMs, ...deps,
  });
  return { adapter, store, archived, deps, run };
}

const SKIPPED_WEEK = '2026-10-03'; // Sat Oct 3 – Fri Oct 9 2026
const LIVE_WEEK = '2026-10-10';
const skippedDrop = getDropAtForScoredWeek(SKIPPED_WEEK);
const FRIDAY_DROP_WEEK = '2026-08-01'; // drops Fri Aug 7 2026, 10:09pm EDT
const fridayDrop = getDropAtForScoredWeek(FRIDAY_DROP_WEEK);

const originalTimezone = process.env.TZ;
beforeAll(() => { process.env.TZ = 'America/New_York'; });
afterAll(() => {
  if (originalTimezone === undefined) delete process.env.TZ;
  else process.env.TZ = originalTimezone;
});

describe('listAvoidEventWeeks', () => {
  it('groups entity and platform event dates into local Sat-Fri weeks, oldest first', async () => {
    const { adapter } = makeAdapter(
      [{ entityId: 'meta', date: '2026-10-12', count: 1 }, { entityId: 'meta', date: '2026-10-09', count: 1 }],
      [{ platformId: 'instagram', date: '2026-10-03', count: 1 }],
    );
    await expect(listAvoidEventWeeks(adapter)).resolves.toEqual([SKIPPED_WEEK, LIVE_WEEK]);
  });
});

describe('resolveDropAtForWeek', () => {
  it('uses the weekly schedule inverse when the beta cadence is off', () => {
    expect(resolveDropAtForWeek(SKIPPED_WEEK, Date.now())).toBe(skippedDrop);
  });
});

describe('capturePendingScorecards', () => {
  it('captures a skipped weekend late, purges only that week, and marks the notice', async () => {
    const { store, deps, run } = setup([
      { entityId: 'meta', date: '2026-10-05', count: 3 },
      { entityId: 'meta', date: '2026-10-12', count: 1 },
    ]);
    const nowMs = skippedDrop + 3 * 24 * HOUR_MS;

    const result = await run(nowMs);

    expect(nowMs - skippedDrop).toBeGreaterThanOrEqual(SCORECARD_PRESENTATION_WINDOW_MS);
    expect(deps.captureWeek).toHaveBeenCalledWith(SKIPPED_WEEK, expect.objectContaining({ grandTotal: 3 }));
    expect(result).toEqual({ captured: [SKIPPED_WEEK], purged: [SKIPPED_WEEK], failedWeek: null });
    expect(deps.markLateCard).toHaveBeenCalledWith(SKIPPED_WEEK);
    expect(store.entity).toEqual([{ entityId: 'meta', date: '2026-10-12', count: 1 }]);
  });

  it('captures inside the presentation window without the late notice', async () => {
    const { deps, run } = setup([{ entityId: 'meta', date: '2026-10-05', count: 1 }]);

    const result = await run(skippedDrop + HOUR_MS);

    expect(result.captured).toEqual([SKIPPED_WEEK]);
    expect(deps.markLateCard).not.toHaveBeenCalled();
  });

  it('never touches a week whose drop has not passed', async () => {
    const { store, deps, run } = setup([{ entityId: 'meta', date: '2026-10-05', count: 2 }]);

    const result = await run(skippedDrop - 60_000);

    expect(deps.captureWeek).not.toHaveBeenCalled();
    expect(result).toEqual({ captured: [], purged: [], failedWeek: null });
    expect(store.entity).toHaveLength(1);
  });

  it('works oldest first and stops at a failed capture, keeping every week', async () => {
    const { store, deps, run } = setup(
      [
        { entityId: 'meta', date: '2026-10-05', count: 1 },
        { entityId: 'meta', date: '2026-09-28', count: 1 },
      ],
      { captureWeek: jest.fn(async () => false) },
    );

    const result = await run(skippedDrop + 3 * 24 * HOUR_MS);

    expect(deps.captureWeek).toHaveBeenCalledTimes(1);
    expect(deps.captureWeek).toHaveBeenCalledWith('2026-09-26', expect.anything());
    expect(result).toEqual({ captured: [], purged: [], failedWeek: '2026-09-26' });
    expect(store.entity).toHaveLength(2);
    expect(deps.markLateCard).not.toHaveBeenCalled();
  });

  it('purges a week too small for a card and cancels an empty in-window drop', async () => {
    const { store, deps, run } = setup(
      [{ entityId: 'meta', date: '2026-10-05', count: 2 }],
      { windowWeek: SKIPPED_WEEK, minAvoids: 3 },
    );

    const result = await run(skippedDrop + HOUR_MS);

    expect(deps.captureWeek).not.toHaveBeenCalled();
    expect(result.purged).toEqual([SKIPPED_WEEK]);
    expect(store.entity).toHaveLength(0);
    expect(deps.cancelDropNotification).toHaveBeenCalledTimes(1);
  });

  it('cancels the drop notification for an in-window week with no events and no card', async () => {
    const { deps, run } = setup([], { windowWeek: SKIPPED_WEEK });
    await run(skippedDrop + HOUR_MS);
    expect(deps.cancelDropNotification).toHaveBeenCalledTimes(1);
  });

  it('keeps the drop notification once the in-window card exists', async () => {
    const { deps, run } = setup([], { windowWeek: SKIPPED_WEEK, archived: [SKIPPED_WEEK] });
    await run(skippedDrop + HOUR_MS);
    expect(deps.cancelDropNotification).not.toHaveBeenCalled();
  });

  it('purges leftovers of an archived week once it is no longer the live week', async () => {
    const { store, deps, run } = setup(
      [{ entityId: 'meta', date: '2026-10-08', count: 1 }],
      { archived: [SKIPPED_WEEK] },
    );

    const result = await run(skippedDrop + 3 * 24 * HOUR_MS);

    expect(deps.captureWeek).not.toHaveBeenCalled();
    expect(result.purged).toEqual([SKIPPED_WEEK]);
    expect(store.entity).toHaveLength(0);
  });

  it('keeps avoids logged after a Friday drop until the local week ends', async () => {
    const { store, deps, run } = setup(
      [{ entityId: 'meta', date: '2026-08-07', count: 1 }],
      { archived: [FRIDAY_DROP_WEEK] },
    );

    const result = await run(fridayDrop + 30 * 60_000);

    expect(deps.captureWeek).not.toHaveBeenCalled();
    expect(result.purged).toEqual([]);
    expect(store.entity).toHaveLength(1);
  });

  it('captures the Friday drop week right at the drop, while it is still the local week', async () => {
    const { store, run } = setup([{ entityId: 'meta', date: '2026-08-04', count: 2 }]);

    const result = await run(fridayDrop + 60_000);

    expect(result.captured).toEqual([FRIDAY_DROP_WEEK]);
    expect(store.entity).toHaveLength(0);
  });
});
