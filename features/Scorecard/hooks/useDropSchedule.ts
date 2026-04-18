import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import type { DropSchedule } from '../types';
import { getCurrentDropTime } from '../../../core/dropSchedule/computeDropTime';
import { getLocalWeekStart } from '../../../core/utils/localDate';
import {
  isBetaScheduleActive,
  getBetaDropTime,
  getNextBetaDropTime,
} from '../../../core/dropSchedule/betaDropSchedule';

/**
 * Stable identifier for the scorecard drop notification. Scoping cancels +
 * re-schedules to this identifier leaves other scheduled notifications
 * (notably the Thursday platform nudge at 'platform-nudge-thursday')
 * untouched.
 */
export const SCORECARD_DROP_NOTIFICATION_ID = 'scorecard-drop';

/**
 * Routing key carried in the notification's content.data. AppShell matches on
 * this — not on the human-readable title — so copy edits can't silently
 * break cold-start and warm-start routing to the Scorecard tab.
 */
export const SCORECARD_DROP_NOTIFICATION_TYPE = 'scorecard-drop';

export interface DropScheduleState {
  schedule: DropSchedule;
  /** Always false — drop time is computed locally with no async work. */
  loading: false;
  /** True when the drop time has passed and the card should be revealed. */
  hasDropped: boolean;
}

/**
 * Computes the weekly drop schedule on-device (deterministic PRNG — no network).
 * Schedules a local push notification for the exact drop moment.
 *
 * When BETA_SCORECARD_INTERVAL_HOURS > 0 (dev builds), uses a shorter cycle
 * instead of the weekly schedule. See core/dropSchedule/betaDropSchedule.ts.
 */
export function useDropSchedule(): DropScheduleState {
  // weekOf is always the current Sat–Fri week regardless of beta override.
  // Only the drop timing changes — aggregation window stays the same.
  const weekOf = getLocalWeekStart();

  let dropAt: number;
  if (isBetaScheduleActive()) {
    const betaDrop = getBetaDropTime();
    dropAt = betaDrop.getTime();
  } else {
    dropAt = getCurrentDropTime().getTime();
  }

  const schedule: DropSchedule = { dropAt, weekOf };
  const hasDropped = Date.now() >= dropAt;

  useEffect(() => {
    const targetMs = isBetaScheduleActive() && hasDropped
      ? getNextBetaDropTime().getTime()  // current period dropped — schedule next
      : dropAt;

    if (targetMs > Date.now()) {
      scheduleDropNotification(targetMs).catch(() => {
        // Notification permission may be denied — silently skip
      });
    }
  }, [dropAt, hasDropped]);

  return { schedule, loading: false, hasDropped };
}

async function scheduleDropNotification(dropAt: number): Promise<void> {
  // Scoped cancel + schedule by identifier. Previously called
  // cancelAllScheduledNotificationsAsync, which silently wiped the Thursday
  // platform nudge ('platform-nudge-thursday') every time the drop was
  // re-scheduled. Cancel only our own identifier here.
  try {
    await Notifications.cancelScheduledNotificationAsync(SCORECARD_DROP_NOTIFICATION_ID);
  } catch {
    // If no prior drop is scheduled, the cancel is a no-op in most builds
    // but some runtimes throw — ignore.
  }

  await Notifications.scheduleNotificationAsync({
    identifier: SCORECARD_DROP_NOTIFICATION_ID,
    content: {
      title: 'Your Scorecard Is Ready',
      body: 'Tap to see how you did this week.',
      sound: true,
      // Routing key — AppShell reads data.type to route to Scorecard,
      // independent of the human-readable title.
      data: { type: SCORECARD_DROP_NOTIFICATION_TYPE },
    },
    trigger: { type: 'date', date: new Date(dropAt) } as Notifications.DateTriggerInput,
  });
}
