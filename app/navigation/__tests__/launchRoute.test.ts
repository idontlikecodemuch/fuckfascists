jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 'default', LOW: 'low' },
  SchedulableTriggerInputTypes: { DATE: 'date', WEEKLY: 'weekly' },
}));

import type * as Notifications from 'expo-notifications';
import { resolveLaunchTab, resolveResumeTab } from '../launchRoute';

function response(data: Record<string, unknown>): Notifications.NotificationResponse {
  return {
    notification: { request: { content: { title: 'x', data } } },
  } as unknown as Notifications.NotificationResponse;
}

describe('resolveLaunchTab', () => {
  const pickTab = () => 'map' as const;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('follows a tapped notification without checking for a pending drop', async () => {
    const hasPendingDrop = jest.fn().mockResolvedValue(true);
    await expect(resolveLaunchTab(
      response({ type: 'early-week-nudge', opens: 'platforms' }), hasPendingDrop, pickTab,
    )).resolves.toBe('platforms');
    expect(hasPendingDrop).not.toHaveBeenCalled();
  });

  it('opens Scorecard while a drop in its window has not been revealed', async () => {
    await expect(resolveLaunchTab(null, async () => true, pickTab)).resolves.toBe('report');
  });

  it('uses the random launch tab otherwise, or when the check fails', async () => {
    await expect(resolveLaunchTab(null, async () => false, pickTab)).resolves.toBe('map');
    await expect(resolveLaunchTab(
      null, () => Promise.reject(new Error('db')), pickTab,
    )).resolves.toBe('map');
  });
});

describe('resolveResumeTab', () => {
  const leftForegroundAt = 1_000;

  it('opens Scorecard for an unrevealed drop when no notification was tapped', () => {
    expect(resolveResumeTab(true, 0, leftForegroundAt)).toBe('report');
    // A tap from an earlier foreground session does not count.
    expect(resolveResumeTab(true, 500, leftForegroundAt)).toBe('report');
  });

  it('lets a notification tap since leaving the foreground win', () => {
    expect(resolveResumeTab(true, 1_500, leftForegroundAt)).toBeNull();
  });

  it('keeps the current tab when nothing is pending', () => {
    expect(resolveResumeTab(false, 0, leftForegroundAt)).toBeNull();
  });
});
