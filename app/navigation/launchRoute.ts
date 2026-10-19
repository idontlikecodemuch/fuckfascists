import type * as Notifications from 'expo-notifications';
import type { Tab } from './TabBar';
import { pickInitialTab } from './initialTab';
import { tabForNotificationResponse } from './notificationRoute';

/**
 * Cold-start tab: a tapped notification's route first, then Scorecard when a
 * drop inside its presentation window still waits for its card, otherwise the
 * weighted random launch tab. Decided before any capture starts, so a fast
 * capture cannot cancel the reveal.
 */
export async function resolveLaunchTab(
  response: Notifications.NotificationResponse | null,
  hasPendingDrop: () => Promise<boolean>,
  pickTab: () => Tab = pickInitialTab,
): Promise<Tab> {
  const routedTab = tabForNotificationResponse(response);
  if (routedTab) return routedTab;

  try {
    return (await hasPendingDrop()) ? 'report' : pickTab();
  } catch {
    return pickTab();
  }
}
