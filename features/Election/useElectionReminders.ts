import { useEffect } from 'react';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { electionCopy } from '../../copy/election';
import { sharedCopy } from '../../copy/shared';
import { getUpcomingElectionReminders } from './electionDays';

/** Routing key in content.data; a tap opens VOTE411 (see openElectionLinkOnce). */
export const ELECTION_REMINDER_TYPE = 'election-reminder';
const ID_PREFIX = 'election-reminder';
const CHANNEL_ID = 'election-reminder';

const isElectionReminderId = (id: string) => id === ID_PREFIX || id.startsWith(`${ID_PREFIX}-`);

async function cancelElectionReminders(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const { identifier } of scheduled) {
      if (isElectionReminderId(identifier)) await Notifications.cancelScheduledNotificationAsync(identifier);
    }
  } catch {
    // Nothing scheduled yet; some runtimes throw instead of no-op.
  }
}

/**
 * Election Day reminders (owner 2026-10-26): "make a plan" two days ahead at
 * 6pm and Election Day at 8am, local time (config/constants ELECTION_*). Runs
 * at startup and when alerts are turned on; replaces its own queue each time,
 * so it never duplicates. Local only.
 */
export function useElectionReminders(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const run = async () => {
      const reminders = getUpcomingElectionReminders(Date.now());
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: electionCopy.channelName,
        importance: Notifications.AndroidImportance.DEFAULT,
      });
      await cancelElectionReminders();
      for (const reminder of reminders) {
        const plan = reminder.kind === 'plan';
        await Notifications.scheduleNotificationAsync({
          identifier: `${ID_PREFIX}-${reminder.kind}`,
          content: {
            title: plan ? electionCopy.planTitle : electionCopy.dayTitle,
            body: plan ? electionCopy.planBody : electionCopy.dayBody,
            sound: true,
            data: { type: ELECTION_REMINDER_TYPE },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: reminder.at,
            channelId: CHANNEL_ID,
          } as Notifications.DateTriggerInput,
        });
      }
    };
    run().catch(() => {
      // Scheduling failed — retried on the next launch.
    });
  }, [enabled]);
}

// Response already handled, so a cold-start tap that is also replayed to the
// response listener opens the link once.
let openedResponseKey: string | null = null;

/** Opens VOTE411 for a tapped election reminder. Returns true if it was one. */
export function openElectionLinkOnce(
  response: Notifications.NotificationResponse | null | undefined,
): boolean {
  const data = response?.notification.request.content.data as { type?: unknown } | undefined;
  if (!response || data?.type !== ELECTION_REMINDER_TYPE) return false;
  const key = `${response.notification.request.identifier}:${response.notification.date}`;
  if (key !== openedResponseKey) {
    openedResponseKey = key;
    Linking.openURL(sharedCopy.voteInfoUrl).catch(() => undefined);
  }
  return true;
}
