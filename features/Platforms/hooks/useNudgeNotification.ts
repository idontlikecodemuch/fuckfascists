import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { NUDGE_DAY, NUDGE_HOUR } from '../../../config/constants';
import { platformsCopy } from '../../../copy/platforms';

const NUDGE_IDENTIFIER = 'platform-nudge-thursday';

/**
 * Schedules a weekly local notification for Thursday evening (NUDGE_HOUR local)
 * to remind the user to log remaining avoids before Friday's scorecard drop.
 *
 * Safe to call on every mount — cancels any existing nudge before re-scheduling.
 * If notification permission is not granted, silently skips.
 */
export function useNudgeNotification(): void {
  useEffect(() => {
    scheduleNudge().catch(() => {
      // Permission denied or scheduling failed — silently skip
    });
  }, []);
}

async function scheduleNudge(): Promise<void> {
  // Cancel the previous nudge to prevent duplicates
  try {
    await Notifications.cancelScheduledNotificationAsync(NUDGE_IDENTIFIER);
  } catch {
    // May not exist yet — ignore
  }

  await Notifications.scheduleNotificationAsync({
    identifier: NUDGE_IDENTIFIER,
    content: {
      title: platformsCopy.nudgeTitle,
      body: platformsCopy.nudgeBody,
      sound: true,
    },
    trigger: {
      type: SchedulableTriggerInputTypes.WEEKLY,
      weekday: NUDGE_DAY + 1, // expo-notifications: 1=Sunday; NUDGE_DAY: 0=Sunday → +1
      hour: NUDGE_HOUR,
      minute: 0,
    },
  });
}
