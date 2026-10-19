const setNotificationHandler = jest.fn();
const deleteNotificationChannelAsync = jest.fn();
const platform = { OS: 'android' };

jest.mock('react-native', () => ({ Platform: platform }));
jest.mock('expo-notifications', () => ({ setNotificationHandler, deleteNotificationChannelAsync }));

import type * as Notifications from 'expo-notifications';
import {
  LEGACY_QUIET_DROP_CHANNEL_ID,
  foregroundBehaviorFor,
  setUpScorecardDropNotifications,
} from '../dropNotificationSetup';

function notification(data?: Record<string, unknown>): Notifications.Notification {
  return { request: { content: { title: 'x', data } } } as unknown as Notifications.Notification;
}

describe('foregroundBehaviorFor', () => {
  it('shows the scorecard drop banner with sound', () => {
    expect(foregroundBehaviorFor(notification({ type: 'scorecard-drop' }))).toEqual({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    });
  });

  it('keeps every other notification hidden in the foreground, as with no handler', () => {
    const hidden = { shouldShowAlert: false, shouldPlaySound: false, shouldSetBadge: false };
    expect(foregroundBehaviorFor(notification({ type: 'early-week-nudge', opens: 'map' }))).toEqual(hidden);
    expect(foregroundBehaviorFor(notification())).toEqual(hidden);
  });
});

describe('setUpScorecardDropNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deleteNotificationChannelAsync.mockResolvedValue(undefined);
  });

  it('registers the foreground handler and deletes the old quiet channel on Android', async () => {
    platform.OS = 'android';
    await setUpScorecardDropNotifications();

    expect(setNotificationHandler).toHaveBeenCalledTimes(1);
    const handler = setNotificationHandler.mock.calls[0][0];
    await expect(handler.handleNotification(notification({ type: 'scorecard-drop' })))
      .resolves.toEqual(expect.objectContaining({ shouldShowAlert: true }));
    expect(deleteNotificationChannelAsync).toHaveBeenCalledWith(LEGACY_QUIET_DROP_CHANNEL_ID);
  });

  it('tolerates a missing channel', async () => {
    platform.OS = 'android';
    deleteNotificationChannelAsync.mockRejectedValueOnce(new Error('no channel'));
    await expect(setUpScorecardDropNotifications()).resolves.toBeUndefined();
  });

  it('skips channel cleanup on iOS', async () => {
    platform.OS = 'ios';
    await setUpScorecardDropNotifications();
    expect(setNotificationHandler).toHaveBeenCalledTimes(1);
    expect(deleteNotificationChannelAsync).not.toHaveBeenCalled();
  });
});
