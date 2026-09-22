import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { NUDGE_DAY, NUDGE_HOUR } from '../../../config/constants';
import { platformsCopy } from '../../../copy/platforms';

const NUDGE_IDENTIFIER = 'platform-nudge-thursday';
// Android channel — without one, expo-notifications drops the nudge onto its
// generic fallback channel, so users can't find or tune it in system settings.
const NUDGE_CHANNEL_ID = 'platform-nudge';

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
  await Notifications.setNotificationChannelAsync(NUDGE_CHANNEL_ID, {
    name: platformsCopy.nudgeChannelName,
    importance: Notifications.AndroidImportance.DEFAULT,
  });

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
      channelId: NUDGE_CHANNEL_ID,
    } as Notifications.WeeklyTriggerInput,
  });
}
