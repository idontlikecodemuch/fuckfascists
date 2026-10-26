const cancelScheduledNotificationAsync = jest.fn();
const cancelAllScheduledNotificationsAsync = jest.fn();
const getAllScheduledNotificationsAsync = jest.fn();
const scheduleNotificationAsync = jest.fn();
const setNotificationChannelAsync = jest.fn();

jest.mock('expo-notifications', () => ({
  cancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  getAllScheduledNotificationsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  AndroidImportance: { DEFAULT: 'default' },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

import type { StorageAdapter } from '../../../core/data';
import type { EntityAvoidEvent, PlatformAvoidEvent } from '../../../core/models';
import { addLocalDays, getLocalWeekStartForDate } from '../../../core/utils/localDate';
import { isElectionWeek } from '../../Election/electionDays';
import { platformsCopy } from '../../../copy/platforms';
import {
  EARLY_WEEK_NUDGE_SKIP_IF_WEEK_ACTIVE,
  EARLY_WEEK_NUDGE_WEEKS_AHEAD,
} from '../../../config/constants';
import {
  EARLY_WEEK_NUDGE_TYPE,
  cancelEarlyWeekNudge,
  earlyWeekNudgeId,
  getActiveWeekToSkip,
  hasAvoidsInWeek,
  scheduleEarlyWeekNudge,
} from '../hooks/useEarlyWeekNudge';
import {
  getEarlyWeekNudgeForWeek,
  hasEarlyWeekNudgeMinutes,
  resolveEarlyWeekNudgeWindow,
} from '../utils/earlyWeekNudge';
import { EARLY_WEEK_NUDGE_LINES, EARLY_WEEK_NUDGE_TIMINGS } from '../utils/earlyWeekNudgeLines';

const WEEK_OF = '2026-10-10'; // Saturday
const SATURDAY_NOON = new Date(2026, 9, 10, 12, 0).getTime();
const WEEK_MS = 7 * 86_400_000;
const MESSAGES = EARLY_WEEK_NUDGE_TIMINGS;
const TITLE_MAX = 30;
const BODY_MAX = 70;

function fakeAdapter(
  entityAvoids: EntityAvoidEvent[],
  platformAvoids: PlatformAvoidEvent[],
): StorageAdapter {
  return {
    getEntityAvoids: jest.fn(async () => entityAvoids),
    getPlatformAvoidsForWeek: jest.fn(async (start: string, end: string) =>
      platformAvoids.filter((event) => event.date >= start && event.date < end)),
  } as unknown as StorageAdapter;
}

function scheduledRequests() {
  return scheduleNotificationAsync.mock.calls.map(([request]) => request);
}

describe('early-week nudge scheduling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    getAllScheduledNotificationsAsync.mockResolvedValue([]);
    scheduleNotificationAsync.mockImplementation(async (request) => request.identifier);
    setNotificationChannelAsync.mockResolvedValue(null);
  });

  it('has lock-screen-length lines, a valid tab, and usable minutes for each', () => {
    expect(EARLY_WEEK_NUDGE_LINES.length).toBeGreaterThanOrEqual(2);
    for (const { title, body, opens, timing } of EARLY_WEEK_NUDGE_LINES) {
      expect(title.length).toBeGreaterThan(0);
      expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
      expect(body.length).toBeGreaterThan(0);
      expect(body.length).toBeLessThanOrEqual(BODY_MAX);
      expect(['platforms', 'map']).toContain(opens);
      expect(hasEarlyWeekNudgeMinutes(timing)).toBe(true);
    }
  });

  it('queues the next weeks on numbered identifiers and its own Android channel', async () => {
    await scheduleEarlyWeekNudge(SATURDAY_NOON);

    expect(setNotificationChannelAsync).toHaveBeenCalledWith('early-week-nudge', {
      name: platformsCopy.earlyNudgeChannelName,
      importance: 'default',
    });
    const requests = scheduledRequests();
    expect(requests).toHaveLength(EARLY_WEEK_NUDGE_WEEKS_AHEAD);
    requests.forEach((request, position) => {
      const slot = getEarlyWeekNudgeForWeek(addLocalDays(WEEK_OF, position * 7), MESSAGES);
      if (!slot) throw new Error('fixture slot missing');
      const line = EARLY_WEEK_NUDGE_LINES[slot.copyIndex];
      expect(request).toEqual({
        identifier: earlyWeekNudgeId(position),
        content: {
          title: line.title,
          body: line.body,
          sound: true,
          data: { type: EARLY_WEEK_NUDGE_TYPE, opens: line.opens },
        },
        trigger: { type: 'date', date: slot.at, channelId: 'early-week-nudge' },
      });
    });
  });

  it('cancels only its own queued identifiers, never the Thursday nudge or scorecard drop', async () => {
    getAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: 'early-week-nudge-1' },
      { identifier: 'early-week-nudge-3' },
      { identifier: 'platform-nudge-thursday' },
      { identifier: 'scorecard-drop' },
    ]);
    await cancelEarlyWeekNudge();

    expect(cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
    const cancelled = cancelScheduledNotificationAsync.mock.calls.map(([id]) => id);
    expect(cancelled).toEqual(['early-week-nudge-1', 'early-week-nudge-3']);
  });

  it('requeues the same times and messages on every launch', async () => {
    await scheduleEarlyWeekNudge(SATURDAY_NOON);
    await scheduleEarlyWeekNudge(SATURDAY_NOON + 3 * 60 * 60 * 1000);
    const requests = scheduledRequests();
    const first = requests.slice(0, EARLY_WEEK_NUDGE_WEEKS_AHEAD);
    const second = requests.slice(EARLY_WEEK_NUDGE_WEEKS_AHEAD);
    expect(second).toEqual(first);
  });

  it('starts the queue at next week when this week is skipped', async () => {
    const nextWeek = getEarlyWeekNudgeForWeek(addLocalDays(WEEK_OF, 7), MESSAGES);
    await scheduleEarlyWeekNudge(SATURDAY_NOON, WEEK_OF);
    expect(scheduledRequests()[0].trigger.date).toEqual(nextWeek?.at);
  });

  it('swallows a cancel that throws when nothing is scheduled', async () => {
    getAllScheduledNotificationsAsync.mockRejectedValueOnce(new Error('unavailable'));
    await expect(cancelEarlyWeekNudge()).resolves.toBeUndefined();
  });

  it('sends each line only inside its own days and hours, never twice in a row', async () => {
    let previousTitle: string | null = null;
    const seen = new Set<string>();
    for (let week = 0; week < 104; week++) {
      // Election weeks have no nudge; the weeks either side may repeat a line.
      if (isElectionWeek(getLocalWeekStartForDate(new Date(SATURDAY_NOON + week * WEEK_MS)))) {
        previousTitle = null;
        continue;
      }
      scheduleNotificationAsync.mockClear();
      await scheduleEarlyWeekNudge(SATURDAY_NOON + week * WEEK_MS);
      const [request] = scheduledRequests();
      const line = EARLY_WEEK_NUDGE_LINES.find((candidate) => candidate.title === request.content.title);
      if (!line) throw new Error(`unknown line ${request.content.title}`);
      const window = resolveEarlyWeekNudgeWindow(line.timing);
      const at: Date = request.trigger.date;
      expect(window.days).toContain(at.getDay());
      expect(at.getHours()).toBeGreaterThanOrEqual(window.startHour);
      expect(at.getHours()).toBeLessThan(window.endHour);
      expect(request.content.data).toEqual({ type: EARLY_WEEK_NUDGE_TYPE, opens: line.opens });
      expect(request.content.title).not.toBe(previousTitle);
      previousTitle = request.content.title;
      seen.add(line.title);
    }
    expect(seen.size).toBe(EARLY_WEEK_NUDGE_LINES.length);
  });
});

describe('hasAvoidsInWeek', () => {
  it('finds a platform avoid logged in the week', async () => {
    const adapter = fakeAdapter([], [{ platformId: 'instagram', date: '2026-10-11', count: 1 }]);
    await expect(hasAvoidsInWeek(adapter, WEEK_OF)).resolves.toBe(true);
  });

  it('finds an entity avoid logged in the week', async () => {
    const adapter = fakeAdapter([{ entityId: 'walmart', date: '2026-10-10', count: 2 }], []);
    await expect(hasAvoidsInWeek(adapter, WEEK_OF)).resolves.toBe(true);
  });

  it('ignores avoids from the previous week and zero counts', async () => {
    const adapter = fakeAdapter(
      [
        { entityId: 'walmart', date: '2026-10-09', count: 3 },
        { entityId: 'target', date: '2026-10-10', count: 0 },
      ],
      [{ platformId: 'instagram', date: '2026-10-08', count: 1 }],
    );
    await expect(hasAvoidsInWeek(adapter, WEEK_OF)).resolves.toBe(false);
  });
});

describe('getActiveWeekToSkip', () => {
  it('follows EARLY_WEEK_NUDGE_SKIP_IF_WEEK_ACTIVE for a week with an avoid', async () => {
    const adapter = fakeAdapter([], [{ platformId: 'instagram', date: '2026-10-11', count: 1 }]);
    await expect(getActiveWeekToSkip(adapter, SATURDAY_NOON))
      .resolves.toBe(EARLY_WEEK_NUDGE_SKIP_IF_WEEK_ACTIVE ? WEEK_OF : null);
  });
});
