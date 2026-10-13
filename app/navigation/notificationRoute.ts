import type * as Notifications from 'expo-notifications';
import type { Tab } from './TabBar';
import { SCORECARD_DROP_NOTIFICATION_TYPE } from '../../features/Scorecard/hooks/useDropSchedule';
import { EARLY_WEEK_NUDGE_TYPE } from '../../features/Platforms/hooks/useEarlyWeekNudge';
import { isEarlyWeekNudgeTab } from '../../features/Platforms/utils/earlyWeekNudgeLines';

/** Legacy drop title for notifications scheduled before data.type routing. */
const LEGACY_SCORECARD_DROP_TITLE = 'Your Scorecard Is Ready';

/**
 * The tab a tapped notification should open, or null to keep the default.
 * Routes on content.data (stable keys), not on the human-readable copy:
 * - scorecard drop → Scorecard (title fallback kept for legacy drops)
 * - early-week nudge → the tab carried in data.opens (Track or the map)
 */
export function tabForNotificationResponse(
  resp: Notifications.NotificationResponse | null | undefined,
): Tab | null {
  if (!resp) return null;
  const content = resp.notification.request.content;
  const data = content.data as { type?: string; opens?: unknown } | undefined;

  if (data?.type === SCORECARD_DROP_NOTIFICATION_TYPE) return 'report';
  // Legacy fallback — remove after one release cycle.
  if (content.title === LEGACY_SCORECARD_DROP_TITLE) return 'report';
  if (data?.type === EARLY_WEEK_NUDGE_TYPE && isEarlyWeekNudgeTab(data.opens)) return data.opens;
  return null;
}
