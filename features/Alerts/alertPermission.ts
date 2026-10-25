import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * The app's notification permission, reduced to what the UI needs:
 * - `on`: alerts are allowed.
 * - `ask`: the system prompt can still be shown (never asked on iOS; on
 *   Android, not yet permanently denied).
 * - `settings`: only the system Settings page can turn alerts on.
 */
export type AlertsStatus = 'on' | 'ask' | 'settings';

export interface AlertsPermission {
  status: AlertsStatus;
  /** True only before the system prompt has ever been answered. */
  neverAsked: boolean;
}

type PermissionResponse = Pick<
  Notifications.NotificationPermissionsStatus,
  'granted' | 'status' | 'canAskAgain'
>;

export function toAlertsPermission(response: PermissionResponse): AlertsPermission {
  if (response.granted) return { status: 'on', neverAsked: false };
  const neverAsked = String(response.status) === 'undetermined';
  return {
    status: neverAsked || response.canAskAgain ? 'ask' : 'settings',
    neverAsked,
  };
}

export async function readAlertsPermission(): Promise<AlertsPermission> {
  return toAlertsPermission(await Notifications.getPermissionsAsync());
}

/** Shows the system Allow prompt. Resolves to the permission afterwards. */
export async function requestAlertsPermission(): Promise<AlertsPermission> {
  return toAlertsPermission(await Notifications.requestPermissionsAsync());
}

/**
 * Turns alerts on the only way the platform allows: the system prompt while
 * it can still be shown, otherwise the app's page in Settings. Also used to
 * turn alerts off (Settings), since an app cannot revoke its own permission.
 */
export async function openAlertsControl(current: AlertsPermission): Promise<AlertsPermission | null> {
  if (current.status === 'ask') return requestAlertsPermission();
  await Linking.openSettings();
  return null;
}
