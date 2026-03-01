import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import type { DropSchedule } from '../types';
import { fetchDropSchedule } from '../data/dropSchedule';

export interface DropScheduleState {
  schedule: DropSchedule | null;
  loading: boolean;
  /** True when the drop time has passed and the card should be revealed. */
  hasDropped: boolean;
}

/**
 * Fetches the weekly drop schedule from the CDN and schedules a local
 * push notification for the exact drop moment.
 *
 * Notification is only scheduled when the drop time is still in the future —
 * avoids firing stale alerts on users who open the app post-drop.
 */
export function useDropSchedule(): DropScheduleState {
  const [schedule, setSchedule] = useState<DropSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchDropSchedule().then(async (fetched) => {
      if (cancelled) return;
      setSchedule(fetched);
      setLoading(false);

      if (fetched && Date.now() < fetched.dropAt) {
        await scheduleDropNotification(fetched.dropAt).catch(() => {
          // Notification permission may be denied — silently skip
        });
      }
    });

    return () => { cancelled = true; };
  }, []);

  const hasDropped = !!schedule && Date.now() >= schedule.dropAt;

  return { schedule, loading, hasDropped };
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
