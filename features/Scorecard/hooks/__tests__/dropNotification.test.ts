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
  scheduleDropNotification,
} from '../useDropSchedule';

describe('scorecard drop notification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cancelScheduledNotificationAsync.mockResolvedValue(undefined);
    scheduleNotificationAsync.mockResolvedValue(SCORECARD_DROP_NOTIFICATION_ID);
    setNotificationChannelAsync.mockResolvedValue(undefined);
  });

  it('schedules the exact drop date with stable routing data', async () => {
    const drop = new Date();
    drop.setHours(12, 34, 0, 0);

    await scheduleDropNotification(drop.getTime());

    expect(cancelScheduledNotificationAsync)
      .toHaveBeenCalledWith(SCORECARD_DROP_NOTIFICATION_ID);
    expect(scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
      identifier: SCORECARD_DROP_NOTIFICATION_ID,
      content: expect.objectContaining({
        title: 'Your Scorecard Is Ready',
        data: { type: SCORECARD_DROP_NOTIFICATION_TYPE },
      }),
      trigger: expect.objectContaining({
        type: 'date',
        date: drop,
      }),
    }));
  });

  it('cancels only the scorecard notification identifier', async () => {
    await cancelScorecardDropNotification();
    expect(cancelScheduledNotificationAsync)
      .toHaveBeenCalledWith(SCORECARD_DROP_NOTIFICATION_ID);
  });
});
