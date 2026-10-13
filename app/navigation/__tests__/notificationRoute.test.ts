jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 'default', LOW: 'low' },
  SchedulableTriggerInputTypes: { DATE: 'date', WEEKLY: 'weekly' },
}));

import type * as Notifications from 'expo-notifications';
import { tabForNotificationResponse } from '../notificationRoute';

function response(title: string, data?: Record<string, unknown>): Notifications.NotificationResponse {
  return {
    notification: { request: { content: { title, data } } },
  } as unknown as Notifications.NotificationResponse;
}

describe('tabForNotificationResponse', () => {
  it('opens Scorecard for the drop, by data type or the legacy title', () => {
    expect(tabForNotificationResponse(response('Anything', { type: 'scorecard-drop' }))).toBe('report');
    expect(tabForNotificationResponse(response('Your Scorecard Is Ready'))).toBe('report');
  });

  it('opens the tab an early-week nudge carries', () => {
    expect(tabForNotificationResponse(response('It’s Taco Tuesday', { type: 'early-week-nudge', opens: 'map' }))).toBe('map');
    expect(tabForNotificationResponse(response('Monday autopilot', { type: 'early-week-nudge', opens: 'platforms' }))).toBe('platforms');
  });

  it('ignores an early-week nudge with a missing or unknown tab', () => {
    expect(tabForNotificationResponse(response('x', { type: 'early-week-nudge' }))).toBeNull();
    expect(tabForNotificationResponse(response('x', { type: 'early-week-nudge', opens: 'dev' }))).toBeNull();
  });

  it('leaves other notifications and no response on the default tab', () => {
    expect(tabForNotificationResponse(response('Scorecard incoming', { type: 'platform-nudge' }))).toBeNull();
    expect(tabForNotificationResponse(null)).toBeNull();
    expect(tabForNotificationResponse(undefined)).toBeNull();
  });
});
