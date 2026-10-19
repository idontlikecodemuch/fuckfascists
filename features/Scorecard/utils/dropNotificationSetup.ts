import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SCORECARD_DROP_NOTIFICATION_TYPE } from '../hooks/useDropSchedule';

/** Android channel used by the v2 schedule for silent overnight drops. */
export const LEGACY_QUIET_DROP_CHANNEL_ID = 'scorecard-drop-quiet';

/**
 * Foreground presentation: the scorecard drop shows its banner with sound
 * while the app is open (a tap uses the normal warm notification routing).
 * Every other notification keeps the expo default for foreground delivery
 * when no handler is set: not shown.
 */
export function foregroundBehaviorFor(
  notification: Notifications.Notification,
): Notifications.NotificationBehavior {
  const data = notification.request.content.data as { type?: unknown } | undefined;
  const isDrop = data?.type === SCORECARD_DROP_NOTIFICATION_TYPE;
  return { shouldShowAlert: isDrop, shouldPlaySound: isDrop, shouldSetBadge: false };
}

/**
 * App-start setup for the drop notification: registers the foreground handler
 * and, on Android, deletes the retired quiet channel (iOS has no channels).
 */
export async function setUpScorecardDropNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => foregroundBehaviorFor(notification),
  });

  if (Platform.OS !== 'android') return;
  try {
    await Notifications.deleteNotificationChannelAsync(LEGACY_QUIET_DROP_CHANNEL_ID);
  } catch {
    // Channel never existed on this install — nothing to remove.
  }
}
