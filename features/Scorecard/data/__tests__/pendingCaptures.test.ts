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

import { SCORECARD_PRESENTATION_WINDOW_MS } from '../../../../config/constants';
import { listAvoidEventWeeks, resolveDropAtForWeek } from '../pendingCaptures';
import {
  FAILING_WEEK,
  HOUR_MS,
  LIVE_WEEK,
  SKIPPED_WEEK,
  makeAdapter,
  setup,
  skippedDrop,
  useNewYorkTimeZone,
} from './pendingCapturesFixtures';

useNewYorkTimeZone();

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
    expect(result).toEqual({
      captured: [SKIPPED_WEEK], purged: [SKIPPED_WEEK], failed: [], abandoned: [], interrupted: false,
    });
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
    expect(result).toEqual({ captured: [], purged: [], failed: [], abandoned: [], interrupted: false });
    expect(store.entity).toHaveLength(1);
  });

  it('works oldest first and keeps going past a failed capture, keeping that week', async () => {
    const captureWeek = jest.fn(async (weekOf: string) => weekOf !== FAILING_WEEK);
    const { store, deps, run } = setup(
      [
        { entityId: 'meta', date: '2026-10-05', count: 1 },
        { entityId: 'meta', date: '2026-09-28', count: 1 },
      ],
      { captureWeek },
    );

    const result = await run(skippedDrop + 3 * 24 * HOUR_MS);

    expect(captureWeek.mock.calls.map(([weekOf]) => weekOf)).toEqual([FAILING_WEEK, SKIPPED_WEEK]);
    expect(result).toEqual({
      captured: [SKIPPED_WEEK], purged: [SKIPPED_WEEK], failed: [FAILING_WEEK], abandoned: [], interrupted: false,
    });
    expect(store.entity).toEqual([{ entityId: 'meta', date: '2026-09-28', count: 1 }]);
    expect(deps.markLateCard).toHaveBeenCalledTimes(1);
  });
});
