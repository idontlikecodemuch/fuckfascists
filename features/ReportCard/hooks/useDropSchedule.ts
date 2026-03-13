import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import type { DropSchedule } from '../types';
import { getCurrentDropTime } from '../../../core/dropSchedule/computeDropTime';
import { getLocalWeekStart } from '../../../core/utils/localDate';

export interface DropScheduleState {
  schedule: DropSchedule;
  /** Always false — drop time is computed locally with no async work. */
  loading: false;
  /** True when the drop time has passed and the card should be revealed. */
  hasDropped: boolean;
}

/**
 * Computes the weekly drop schedule on-device (deterministic PRNG — no network).
 * Schedules a local push notification for the exact drop moment.
 *
 * The drop time is available synchronously on first render. No loading state,
 * no network dependency.
 */
export function useDropSchedule(): DropScheduleState {
  const dropAt = getCurrentDropTime().getTime();
  const weekOf = getLocalWeekStart();
  const schedule: DropSchedule = { dropAt, weekOf };
  const hasDropped = Date.now() >= dropAt;

  useEffect(() => {
    if (dropAt > Date.now()) {
      scheduleDropNotification(dropAt).catch(() => {
        // Notification permission may be denied — silently skip
      });
    }
  }, [dropAt]);

  return { schedule, loading: false, hasDropped };
}

async function scheduleDropNotification(dropAt: number): Promise<void> {
  // Cancel any previously scheduled drop notification before re-scheduling
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Your Report Card Is Ready',
      body: 'Tap to see how you did this week.',
      sound: true,
    },
    trigger: { type: 'date', date: new Date(dropAt) } as Notifications.DateTriggerInput,
  });
}
