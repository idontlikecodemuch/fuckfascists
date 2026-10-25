const cancelScheduledNotificationAsync = jest.fn();
const scheduleNotificationAsync = jest.fn();
const setNotificationChannelAsync = jest.fn();

jest.mock('expo-notifications', () => ({
  cancelScheduledNotificationAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  AndroidNotificationPriority: { LOW: 'low', DEFAULT: 'default' },
  AndroidImportance: { LOW: 'low', DEFAULT: 'default' },
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

import {
  SCORECARD_DROP_NOTIFICATION_ID,
  SCORECARD_DROP_NOTIFICATION_TYPE,
  cancelScorecardDropNotification,
  getDropNotificationTime,
  scheduleDropNotification,
} from '../useDropSchedule';

/** Local wall-clock time on Friday Oct 23 2026 (+dayOffset days). */
function local(hour: number, minute = 0, dayOffset = 0): number {
  return new Date(2026, 9, 23 + dayOffset, hour, minute).getTime();
}

describe('getDropNotificationTime', () => {
  it('notifies at the drop itself outside quiet hours', () => {
    expect(getDropNotificationTime(local(16, 7))).toBe(local(16, 7));
    expect(getDropNotificationTime(local(22, 59))).toBe(local(22, 59));
    expect(getDropNotificationTime(local(9, 0))).toBe(local(9, 0));
  });

  it('moves a late-night drop to 9:00 the next morning', () => {
    expect(getDropNotificationTime(local(23, 0))).toBe(local(9, 0, 1));
    expect(getDropNotificationTime(local(23, 45))).toBe(local(9, 0, 1));
  });

  it('moves an early-morning drop to 9:00 the same morning', () => {
    expect(getDropNotificationTime(local(0, 30, 1))).toBe(local(9, 0, 1));
    expect(getDropNotificationTime(local(8, 59, 1))).toBe(local(9, 0, 1));
  });
});

describe('scorecard drop notification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    scheduleNotificationAsync.mockResolvedValue(SCORECARD_DROP_NOTIFICATION_ID);
    setNotificationChannelAsync.mockResolvedValue(undefined);
  });

  it('schedules the exact drop date with stable routing data and normal sound', async () => {
    const drop = new Date(local(12, 34));

    await scheduleDropNotification(drop.getTime());

    expect(cancelScheduledNotificationAsync)
      .toHaveBeenCalledWith(SCORECARD_DROP_NOTIFICATION_ID);
    expect(scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
      identifier: SCORECARD_DROP_NOTIFICATION_ID,
      content: expect.objectContaining({
        title: 'Your Scorecard Is Ready',
        sound: true,
        interruptionLevel: 'active',
        priority: 'default',
        data: { type: SCORECARD_DROP_NOTIFICATION_TYPE },
      }),
      trigger: expect.objectContaining({
        type: 'date',
        date: drop,
        channelId: 'scorecard-drop',
      }),
    }));
  });

  it('defers a quiet-hours drop to the next 9:00 and keeps it audible', async () => {
    await scheduleDropNotification(local(23, 30));

    expect(scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
      content: expect.objectContaining({ sound: true, interruptionLevel: 'active' }),
      trigger: expect.objectContaining({
        date: new Date(local(9, 0, 1)),
        channelId: 'scorecard-drop',
      }),
    }));
  });

  it('only sets up the standard scorecard channel', async () => {
    await scheduleDropNotification(local(2, 0, 1));

    expect(setNotificationChannelAsync).toHaveBeenCalledTimes(1);
    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      'scorecard-drop',
      expect.objectContaining({ importance: 'default' }),
    );
  });

  it('cancels only the scorecard notification identifier', async () => {
    await cancelScorecardDropNotification();
    expect(cancelScheduledNotificationAsync)
      .toHaveBeenCalledWith(SCORECARD_DROP_NOTIFICATION_ID);
  });
});
