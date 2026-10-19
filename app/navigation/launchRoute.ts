import type * as Notifications from 'expo-notifications';
import type { AppStateStatus } from 'react-native';
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

/**
 * Resume detection: only a return from 'background' counts. inactive→active
 * (system dialogs such as a permission prompt, Notification Center, Control
 * Center) is not a resume, so it never reroutes or re-runs the capture.
 */
export function nextResumeState(
  inBackground: boolean,
  next: AppStateStatus,
): { resumed: boolean; inBackground: boolean } {
  if (next === 'background') return { resumed: false, inBackground: true };
  if (next === 'active') return { resumed: inBackground, inBackground: false };
  return { resumed: false, inBackground };
}

/**
 * Resume tab: Scorecard for a pending drop, unless a notification tap has
 * already routed since the app left the foreground. The tap wins on resume,
 * as it does on cold start (e.g. an early-week nudge that opens Track).
 */
export function resolveResumeTab(
  hasPendingDrop: boolean,
  notificationRoutedAt: number,
  leftForegroundAt: number,
): Tab | null {
  if (notificationRoutedAt >= leftForegroundAt) return null;
  return hasPendingDrop ? 'report' : null;
}
