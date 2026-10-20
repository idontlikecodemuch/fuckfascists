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
  SCORECARD_CAPTURE_GIVE_UP_DAYS,
  SCORECARD_CAPTURE_GIVE_UP_MIN_ATTEMPTS,
  SCORECARD_CAPTURE_GIVE_UP_MIN_FAILING_DAYS,
} from '../../../../config/constants';
import {
  FAILING_WEEK,
  HOUR_MS,
  failingDrop,
  setup,
  skippedDrop,
  useNewYorkTimeZone,
} from './pendingCapturesFixtures';

useNewYorkTimeZone();

const DAY_MS = 24 * HOUR_MS;
const failingEvents = [{ entityId: 'meta', date: '2026-09-28', count: 1 }];
const alwaysFails = () => ({ captureWeek: jest.fn(async () => false) });

describe('capturePendingScorecards — app not in the foreground', () => {
  it('stops before capturing when the app is not active, counting no failure', async () => {
    const { store, deps, failureStore, run } = setup(failingEvents, {
      foregroundSession: jest.fn(() => null),
    });

    const result = await run(failingDrop + 40 * DAY_MS);

    expect(deps.captureWeek).not.toHaveBeenCalled();
    expect(result).toEqual({ captured: [], purged: [], failed: [], abandoned: [], interrupted: true, late: [], lateReveal: null });
    expect(failureStore.value).toEqual({});
    expect(store.entity).toHaveLength(1);
  });

  it('does not count a capture that fails after the app left the foreground', async () => {
    const sessions = [1, 2];
    const { store, deps, failureStore, run } = setup(
      [...failingEvents, { entityId: 'meta', date: '2026-10-05', count: 1 }],
      { ...alwaysFails(), foregroundSession: jest.fn(() => sessions.shift() ?? 2) },
    );

    const result = await run(skippedDrop + 40 * DAY_MS);

    expect(deps.captureWeek).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ captured: [], purged: [], failed: [], abandoned: [], interrupted: true, late: [], lateReveal: null });
    expect(failureStore.value).toEqual({});
    expect(store.entity).toHaveLength(2);
  });
});

describe('capturePendingScorecards — give-up rule', () => {
  const oldDrop = failingDrop + (SCORECARD_CAPTURE_GIVE_UP_DAYS + 30) * DAY_MS;

  it('keeps an old week after a single failed attempt and records it', async () => {
    const { store, failureStore, run } = setup(failingEvents, alwaysFails());

    const result = await run(oldDrop);

    expect(result.failed).toEqual([FAILING_WEEK]);
    expect(result.abandoned).toEqual([]);
    expect(store.entity).toHaveLength(1);
    expect(failureStore.value).toEqual({ [FAILING_WEEK]: { firstFailedAt: oldDrop, attempts: 1 } });
  });

  it('keeps a week that failed often but only recently', async () => {
    const firstFailedAt = oldDrop - (SCORECARD_CAPTURE_GIVE_UP_MIN_FAILING_DAYS - 1) * DAY_MS;
    const { store, failureStore, run } = setup(failingEvents, {
      ...alwaysFails(),
      failures: { [FAILING_WEEK]: { firstFailedAt, attempts: 10 } },
    });

    expect((await run(oldDrop)).abandoned).toEqual([]);
    expect(store.entity).toHaveLength(1);
    expect(failureStore.value[FAILING_WEEK]).toEqual({ firstFailedAt, attempts: 11 });
  });

  it('keeps a week that failed long ago but too few times', async () => {
    const firstFailedAt = oldDrop - 20 * DAY_MS;
    const { store, run } = setup(failingEvents, {
      ...alwaysFails(),
      failures: { [FAILING_WEEK]: { firstFailedAt, attempts: SCORECARD_CAPTURE_GIVE_UP_MIN_ATTEMPTS - 2 } },
    });

    expect((await run(oldDrop)).abandoned).toEqual([]);
    expect(store.entity).toHaveLength(1);
  });

  it('keeps a week whose drop is not yet old enough', async () => {
    const nowMs = failingDrop + (SCORECARD_CAPTURE_GIVE_UP_DAYS - 1) * DAY_MS;
    const { store, run } = setup(failingEvents, {
      ...alwaysFails(),
      failures: { [FAILING_WEEK]: { firstFailedAt: failingDrop, attempts: 20 } },
    });

    expect((await run(nowMs)).abandoned).toEqual([]);
    expect(store.entity).toHaveLength(1);
  });

  it('purges without a card once all three conditions hold, and clears the record', async () => {
    const firstFailedAt = oldDrop - SCORECARD_CAPTURE_GIVE_UP_MIN_FAILING_DAYS * DAY_MS;
    const { store, archived, failureStore, run } = setup(failingEvents, {
      ...alwaysFails(),
      failures: { [FAILING_WEEK]: { firstFailedAt, attempts: SCORECARD_CAPTURE_GIVE_UP_MIN_ATTEMPTS - 1 } },
    });

    const result = await run(oldDrop);

    expect(result).toEqual({
      captured: [], purged: [FAILING_WEEK], failed: [FAILING_WEEK], abandoned: [FAILING_WEEK], interrupted: false, late: [], lateReveal: null,
    });
    expect(store.entity).toHaveLength(0);
    expect(archived.size).toBe(0);
    expect(failureStore.value).toEqual({});
  });

  it('clears the record when a retry succeeds, and drops records of weeks with no events', async () => {
    const { failureStore, run } = setup(failingEvents, {
      failures: {
        [FAILING_WEEK]: { firstFailedAt: failingDrop, attempts: 2 },
        '2026-01-03': { firstFailedAt: failingDrop, attempts: 1 },
      },
    });

    const result = await run(failingDrop + 3 * DAY_MS);

    expect(result.captured).toEqual([FAILING_WEEK]);
    expect(failureStore.value).toEqual({});
  });
});
