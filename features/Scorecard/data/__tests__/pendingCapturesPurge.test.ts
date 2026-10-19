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

import {
  FRIDAY_DROP_WEEK,
  HOUR_MS,
  SATURDAY_AFTER_FRIDAY_DROP,
  SKIPPED_WEEK,
  fridayDrop,
  setup,
  skippedDrop,
  useNewYorkTimeZone,
} from './pendingCapturesFixtures';

useNewYorkTimeZone();

describe('capturePendingScorecards purges', () => {
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

  it('captures the Friday drop week at the drop but purges it only after local midnight', async () => {
    const { store, run } = setup([{ entityId: 'meta', date: '2026-08-04', count: 2 }]);

    const atDrop = await run(fridayDrop + 60_000);
    expect(atDrop.captured).toEqual([FRIDAY_DROP_WEEK]);
    expect(atDrop.purged).toEqual([]);
    expect(store.entity).toHaveLength(1);

    const sameEvening = await run(fridayDrop + HOUR_MS);
    expect(sameEvening).toEqual({ captured: [], purged: [], failed: [], abandoned: [], interrupted: false });

    const afterMidnight = await run(SATURDAY_AFTER_FRIDAY_DROP);
    expect(afterMidnight.purged).toEqual([FRIDAY_DROP_WEEK]);
    expect(store.entity).toHaveLength(0);
  });

  it('does not purge a below-minimum week while it is still the live week', async () => {
    const { store, run } = setup(
      [{ entityId: 'meta', date: '2026-08-05', count: 1 }],
      { minAvoids: 3 },
    );

    const result = await run(fridayDrop + 30 * 60_000);

    expect(result).toEqual({ captured: [], purged: [], failed: [], abandoned: [], interrupted: false });
    expect(store.entity).toHaveLength(1);
  });
});
