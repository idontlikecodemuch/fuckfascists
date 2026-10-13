const cancelScheduledNotificationAsync = jest.fn();
const cancelAllScheduledNotificationsAsync = jest.fn();
const scheduleNotificationAsync = jest.fn();
const setNotificationChannelAsync = jest.fn();

jest.mock('expo-notifications', () => ({
  cancelScheduledNotificationAsync,
  cancelAllScheduledNotificationsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  AndroidImportance: { DEFAULT: 'default' },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

import type { StorageAdapter } from '../../../core/data';
import type { EntityAvoidEvent, PlatformAvoidEvent } from '../../../core/models';
import { addLocalDays } from '../../../core/utils/localDate';
import { platformsCopy } from '../../../copy/platforms';
import {
  EARLY_WEEK_NUDGE_ID,
  EARLY_WEEK_NUDGE_TYPE,
  cancelEarlyWeekNudge,
  getActiveWeekToSkip,
  scheduleEarlyWeekNudge,
} from '../hooks/useEarlyWeekNudge';
import { getEarlyWeekNudgeForWeek } from '../utils/earlyWeekNudge';
import { EARLY_WEEK_NUDGE_DAYS } from '../../../config/constants';
import { earlyWeekNudgeLinesForDay } from '../utils/earlyWeekNudgeLines';

const WEEK_OF = '2026-10-10'; // Saturday
const SATURDAY_NOON = new Date(2026, 9, 10, 12, 0).getTime();
const COPY_COUNT = (weekday: number) => earlyWeekNudgeLinesForDay(weekday).length;
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

describe('early-week nudge scheduling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    scheduleNotificationAsync.mockResolvedValue(EARLY_WEEK_NUDGE_ID);
    setNotificationChannelAsync.mockResolvedValue(null);
  });

  it('has lock-screen-length lines with a valid tab for every window day', () => {
    for (const day of EARLY_WEEK_NUDGE_DAYS) {
      const lines = earlyWeekNudgeLinesForDay(day);
      expect(lines.length).toBeGreaterThanOrEqual(2);
      for (const { title, body, opens } of lines) {
        expect(title.length).toBeGreaterThan(0);
        expect(title.length).toBeLessThanOrEqual(TITLE_MAX);
        expect(body.length).toBeGreaterThan(0);
        expect(body.length).toBeLessThanOrEqual(BODY_MAX);
        expect(['platforms', 'map']).toContain(opens);
      }
    }
  });

  it('only sends a day its own lines, and never the same line two weeks running', async () => {
    let previousTitle: string | null = null;
    for (let week = 0; week < 104; week++) {
      scheduleNotificationAsync.mockClear();
      await scheduleEarlyWeekNudge(SATURDAY_NOON + week * 7 * 86_400_000);
      const [request] = scheduleNotificationAsync.mock.calls[0];
      const day = request.trigger.date.getDay();
      const titles = earlyWeekNudgeLinesForDay(day).map((line) => line.title);
      expect(titles).toContain(request.content.title);
      expect(request.content.title).not.toBe(previousTitle);
      previousTitle = request.content.title;
    }
  });

  it('schedules the week slot on its own identifier and Android channel', async () => {
    const slot = getEarlyWeekNudgeForWeek(WEEK_OF, COPY_COUNT);
    if (!slot) throw new Error('fixture slot missing');
    const line = earlyWeekNudgeLinesForDay(slot.at.getDay())[slot.copyIndex];

    await scheduleEarlyWeekNudge(SATURDAY_NOON);

    expect(setNotificationChannelAsync).toHaveBeenCalledWith('early-week-nudge', {
      name: platformsCopy.earlyNudgeChannelName,
      importance: 'default',
    });
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(scheduleNotificationAsync).toHaveBeenCalledWith({
      identifier: EARLY_WEEK_NUDGE_ID,
      content: {
        title: line.title,
        body: line.body,
        sound: true,
        data: { type: EARLY_WEEK_NUDGE_TYPE, opens: line.opens },
      },
      trigger: { type: 'date', date: slot.at, channelId: 'early-week-nudge' },
    });
  });

  it('cancels only its own identifier — never the Thursday nudge or scorecard drop', async () => {
    await scheduleEarlyWeekNudge(SATURDAY_NOON);
    await cancelEarlyWeekNudge();

    expect(cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
    for (const [id] of cancelScheduledNotificationAsync.mock.calls) {
      expect(id).toBe(EARLY_WEEK_NUDGE_ID);
    }
    expect(EARLY_WEEK_NUDGE_ID).not.toBe('platform-nudge-thursday');
    expect(EARLY_WEEK_NUDGE_ID).not.toBe('scorecard-drop');
  });

  it('reschedules to the same time and message on every launch', async () => {
    await scheduleEarlyWeekNudge(SATURDAY_NOON);
    await scheduleEarlyWeekNudge(SATURDAY_NOON + 3 * 60 * 60 * 1000);
    const [first, second] = scheduleNotificationAsync.mock.calls.map(([request]) => request);
    expect(second).toEqual(first);
  });

  it('schedules next week when this week is skipped', async () => {
    const nextWeek = getEarlyWeekNudgeForWeek(addLocalDays(WEEK_OF, 7), COPY_COUNT);
    await scheduleEarlyWeekNudge(SATURDAY_NOON, WEEK_OF);
    expect(scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
      trigger: expect.objectContaining({ date: nextWeek?.at }),
    }));
  });

  it('swallows a cancel that throws when nothing is scheduled', async () => {
    cancelScheduledNotificationAsync.mockRejectedValueOnce(new Error('not found'));
    await expect(cancelEarlyWeekNudge()).resolves.toBeUndefined();
  });
});

describe('getActiveWeekToSkip', () => {
  it('skips the current week once a platform avoid is logged in it', async () => {
    const adapter = fakeAdapter([], [{ platformId: 'instagram', date: '2026-10-11', count: 1 }]);
    await expect(getActiveWeekToSkip(adapter, SATURDAY_NOON)).resolves.toBe(WEEK_OF);
  });

  it('skips the current week once an entity avoid is logged in it', async () => {
    const adapter = fakeAdapter([{ entityId: 'walmart', date: '2026-10-10', count: 2 }], []);
    await expect(getActiveWeekToSkip(adapter, SATURDAY_NOON)).resolves.toBe(WEEK_OF);
  });

  it('does not skip for avoids from the previous week or zero counts', async () => {
    const adapter = fakeAdapter(
      [
        { entityId: 'walmart', date: '2026-10-09', count: 3 },
        { entityId: 'target', date: '2026-10-10', count: 0 },
      ],
      [{ platformId: 'instagram', date: '2026-10-08', count: 1 }],
    );
    await expect(getActiveWeekToSkip(adapter, SATURDAY_NOON)).resolves.toBeNull();
  });
});
