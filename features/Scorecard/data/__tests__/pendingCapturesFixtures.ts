/**
 * Shared fixtures for the capturePendingScorecards suites. Test files must
 * register the expo module mocks before importing this file.
 */
import type { StorageAdapter } from '../../../../core/data';
import type { Entity, EntityAvoidEvent, PlatformAvoidEvent } from '../../../../core/models';
import type { Platform } from '../../../Platforms/types';
import { getDropAtForScoredWeek } from '../../utils/scoredWeek';
import { capturePendingScorecards, type CapturePendingInput } from '../pendingCaptures';

export const HOUR_MS = 60 * 60 * 1000;

export const meta: Entity = {
  id: 'meta', canonicalName: 'Meta Platforms', aliases: ['Meta'],
  domains: ['meta.com'], categoryTags: ['social'], ceoName: 'Mark Zuckerberg',
  verificationStatus: 'manual', lastVerifiedDate: '2026-01-01',
};

export const instagram: Platform = {
  id: 'instagram', name: 'Instagram', entityId: 'meta',
  parentCompany: 'Meta Platforms', ceoName: 'Mark Zuckerberg',
  categoryTags: ['social'], sortOrder: 1, defaultSelected: true,
};

export function makeAdapter(entityEvents: EntityAvoidEvent[], platformEvents: PlatformAvoidEvent[] = []) {
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

export function setup(
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

export const SKIPPED_WEEK = '2026-10-03'; // Sat Oct 3 – Fri Oct 9 2026
export const LIVE_WEEK = '2026-10-10';
export const skippedDrop = getDropAtForScoredWeek(SKIPPED_WEEK);
export const FRIDAY_DROP_WEEK = '2026-08-01'; // drops Fri Aug 7 2026, 10:09pm EDT
export const fridayDrop = getDropAtForScoredWeek(FRIDAY_DROP_WEEK);
export const SATURDAY_AFTER_FRIDAY_DROP = Date.parse('2026-08-08T00:30:00-04:00');
export const FAILING_WEEK = '2026-09-26'; // drops Fri Oct 2 2026
export const failingDrop = getDropAtForScoredWeek(FAILING_WEEK);

/** Pins local time to America/New_York for the suite (week keys are local). */
export function useNewYorkTimeZone(): void {
  const originalTimezone = process.env.TZ;
  beforeAll(() => { process.env.TZ = 'America/New_York'; });
  afterAll(() => {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  });
}
