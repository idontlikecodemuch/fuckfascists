import * as Notifications from 'expo-notifications';
import { betaCopy } from '../../copy/beta';
import { getNextScorecardDropAfter } from '../Scorecard/utils/dropTime';
import { getDropNotificationTime } from '../Scorecard/hooks/useDropSchedule';

/**
 * Tester readout (beta badge tap): the notification permission as iOS or
 * Android reports it, the identifiers of the queued alerts, and when the
 * next drop alert would fire. Scheduling errors are silent in the app, so
 * this is the way to see that alerts are set up on a device.
 */
export async function buildAlertsReadout(nowMs = Date.now()): Promise<string> {
  const [permission, scheduled] = await Promise.all([
    Notifications.getPermissionsAsync(),
    Notifications.getAllScheduledNotificationsAsync(),
  ]);

  const ids = scheduled.map((request) => request.identifier).sort();
  const nextAlert = new Date(getDropNotificationTime(getNextScorecardDropAfter(nowMs).getTime()));
  const when = nextAlert.toLocaleString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return [
    betaCopy.alertsPermission(String(permission.status)),
    ids.length > 0 ? betaCopy.alertsQueued(ids.join(', ')) : betaCopy.alertsQueuedNone,
    betaCopy.alertsNextDrop(when),
  ].join('\n');
}
