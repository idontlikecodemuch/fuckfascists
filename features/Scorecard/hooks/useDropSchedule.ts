import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import type { DropSchedule } from '../types';
import { getLocalWeekStart } from '../../../core/utils/localDate';
import {
  getScorecardDropRefreshDelayMs,
  getScorecardDropTimeForTimestamp,
} from '../utils/dropTime';
import {
  isBetaScheduleActive,
  getBetaDropTime,
} from '../../../core/dropSchedule/betaDropSchedule';
import { isQuietNotificationHour } from '../../../core/utils/quietHours';
import { SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR } from '../../../config/constants';

/**
 * Stable identifier for the scorecard drop notification. Scoping cancels +
 * re-schedules to this identifier leaves other scheduled notifications
 * (notably the Thursday platform nudge at 'platform-nudge-thursday')
 * untouched.
 */
export const SCORECARD_DROP_NOTIFICATION_ID = 'scorecard-drop';
const SCORECARD_DROP_CHANNEL_ID = 'scorecard-drop';

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
 * Notification scheduling lives in useScorecardDropNotification so it can run
 * at app-shell startup instead of only when the Scorecard tab mounts.
 *
 * When BETA_SCORECARD_INTERVAL_HOURS > 0 (dev builds), uses a shorter cycle
 * instead of the weekly schedule. See core/dropSchedule/betaDropSchedule.ts.
 */
export function useDropSchedule(): DropScheduleState {
  const [nowMs, setNowMs] = useState(() => Date.now());
  // weekOf is always the current Sat–Fri week regardless of beta override.
  // Only the drop timing changes — aggregation window stays the same.
  const weekOf = getLocalWeekStart();

  let dropAt: number;
  if (isBetaScheduleActive()) {
    const betaDrop = getBetaDropTime();
    dropAt = betaDrop.getTime();
  } else {
    dropAt = getScorecardDropTimeForTimestamp(nowMs).getTime();
  }

  const schedule: DropSchedule = { dropAt, weekOf };
  const hasDropped = nowMs >= dropAt;

  useEffect(() => {
    const delayMs = getScorecardDropRefreshDelayMs(Date.now(), dropAt);
    if (delayMs === null) return undefined;

    const timer = setTimeout(() => {
      setNowMs(Date.now());
    }, delayMs);

    return () => clearTimeout(timer);
  }, [dropAt, hasDropped]);

  return { schedule, loading: false, hasDropped };
}

/**
 * When the drop notification should fire for a drop at `dropAt`, in device
 * local time: at the drop itself, or — when the drop falls in local quiet
 * hours — at the next local SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR (9am).
 * The weekly schedule keeps continental-US drops out of quiet hours; this
 * covers other timezones and the beta cadence.
 */
export function getDropNotificationTime(dropAt: number): number {
  const drop = new Date(dropAt);
  if (!isQuietNotificationHour(drop.getHours())) return dropAt;

  const morning = new Date(dropAt);
  morning.setHours(SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR, 0, 0, 0);
  if (morning.getTime() <= dropAt) morning.setDate(morning.getDate() + 1);
  return morning.getTime();
}

export async function scheduleDropNotification(dropAt: number): Promise<void> {
  await Notifications.setNotificationChannelAsync(SCORECARD_DROP_CHANNEL_ID, {
    name: 'Scorecard drops',
    importance: Notifications.AndroidImportance.DEFAULT,
  });

  // Scoped cancel + schedule by identifier. Previously called
  // cancelAllScheduledNotificationsAsync, which silently wiped the Thursday
  // platform nudge ('platform-nudge-thursday') every time the drop was
  // re-scheduled. Cancel only our own identifier here.
  await cancelScorecardDropNotification();

  await Notifications.scheduleNotificationAsync({
    identifier: SCORECARD_DROP_NOTIFICATION_ID,
    content: {
      title: 'Your Scorecard Is Ready',
      body: 'Tap to see how you did this week.',
      sound: true,
      interruptionLevel: 'active',
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
      // Routing key — AppShell reads data.type to route to Scorecard,
      // independent of the human-readable title.
      data: { type: SCORECARD_DROP_NOTIFICATION_TYPE },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(getDropNotificationTime(dropAt)),
      channelId: SCORECARD_DROP_CHANNEL_ID,
    } as Notifications.DateTriggerInput,
  });
}

export async function cancelScorecardDropNotification(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(SCORECARD_DROP_NOTIFICATION_ID);
  } catch {
    // If no prior drop is scheduled, the cancel is a no-op in most builds
    // but some runtimes throw — ignore.
  }
}
