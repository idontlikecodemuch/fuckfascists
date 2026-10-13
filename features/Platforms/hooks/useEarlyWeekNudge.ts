import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import type { StorageAdapter } from '../../../core/data';
import { getAllEntityAvoids, getPlatformAvoidsForWeek } from '../../../core/data';
import { addLocalDays, getLocalWeekStartForDate } from '../../../core/utils/localDate';
import {
  EARLY_WEEK_NUDGE_SKIP_IF_WEEK_ACTIVE,
  EARLY_WEEK_NUDGE_WEEKS_AHEAD,
} from '../../../config/constants';
import { platformsCopy } from '../../../copy/platforms';
import { getUpcomingEarlyWeekNudges } from '../utils/earlyWeekNudge';
import { EARLY_WEEK_NUDGE_LINES, EARLY_WEEK_NUDGE_TIMINGS } from '../utils/earlyWeekNudgeLines';

/**
 * Identifier prefix. Queued nudges are 'early-week-nudge-1' (soonest) to
 * '-N'. Cancels and reschedules touch only IDs with this prefix, never the
 * Thursday nudge ('platform-nudge-thursday') or the scorecard drop
 * ('scorecard-drop').
 */
export const EARLY_WEEK_NUDGE_ID_PREFIX = 'early-week-nudge';

export function earlyWeekNudgeId(position: number): string {
  return `${EARLY_WEEK_NUDGE_ID_PREFIX}-${position + 1}`;
}

function isEarlyWeekNudgeId(identifier: string): boolean {
  return identifier === EARLY_WEEK_NUDGE_ID_PREFIX ||
    identifier.startsWith(`${EARLY_WEEK_NUDGE_ID_PREFIX}-`);
}
/** Carried in content.data so the notification can be identified or routed. */
export const EARLY_WEEK_NUDGE_TYPE = 'early-week-nudge';
// Android channel: its own entry in system settings, separate from the
// Thursday nudge, so users can mute one without the other.
const EARLY_WEEK_NUDGE_CHANNEL_ID = 'early-week-nudge';

/**
 * Keeps the next EARLY_WEEK_NUDGE_WEEKS_AHEAD early-week nudges queued, so
 * someone who stops opening the app gets that many weekly nudges and then no
 * more. Each launch rolls the queue forward.
 *
 * Runs at app-shell startup and again after avoid writes (refreshKey); with
 * EARLY_WEEK_NUDGE_SKIP_IF_WEEK_ACTIVE on, a week the user has already
 * started is skipped. Local only: stores nothing, makes no network calls. If
 * notification permission is missing or scheduling fails, it does nothing.
 */
export function useEarlyWeekNudge(adapter: StorageAdapter, refreshKey = 0): void {
  // Sync-ref: adapter is only read inside async work, not a render input.
  const adapterRef = useRef(adapter);
  adapterRef.current = adapter;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const nowMs = Date.now();
        const skipWeekOf = await getActiveWeekToSkip(adapterRef.current, nowMs);
        if (cancelled) return;
        await scheduleEarlyWeekNudge(nowMs, skipWeekOf);
      } catch {
        // Permission denied, storage error, or scheduling failed — skip.
      }
    };

    void run();

    return () => { cancelled = true; };
  }, [refreshKey]);
}

/**
 * Returns the current scored week's start date when it should be skipped
 * (the user already logged an avoid in it), otherwise null.
 */
export async function getActiveWeekToSkip(
  adapter: StorageAdapter,
  nowMs: number,
): Promise<string | null> {
  if (!EARLY_WEEK_NUDGE_SKIP_IF_WEEK_ACTIVE) return null;
  const weekOf = getLocalWeekStartForDate(new Date(nowMs));
  return (await hasAvoidsInWeek(adapter, weekOf)) ? weekOf : null;
}

/** True when any entity or platform avoid is logged in [weekOf, weekOf+7). */
export async function hasAvoidsInWeek(
  adapter: StorageAdapter,
  weekOf: string,
): Promise<boolean> {
  const weekEnd = addLocalDays(weekOf, 7);
  const [platformAvoids, entityAvoids] = await Promise.all([
    getPlatformAvoidsForWeek(adapter, weekOf),
    getAllEntityAvoids(adapter),
  ]);
  if (platformAvoids.length > 0) return true;
  return entityAvoids.some(
    (event) => event.count > 0 && event.date >= weekOf && event.date < weekEnd,
  );
}

/** Cancels every pending early-week nudge. Touches no other notification. */
export async function cancelEarlyWeekNudge(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const ids = scheduled.map((request) => request.identifier).filter(isEarlyWeekNudgeId);
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  } catch {
    // Nothing scheduled yet; some runtimes throw instead of no-op.
  }
}

/**
 * Replaces the queued early-week nudges with the next
 * EARLY_WEEK_NUDGE_WEEKS_AHEAD due after `nowMs`, skipping `skipWeekOf`.
 * Each week always maps to the same time and message, so calling this on
 * every launch is safe.
 */
export async function scheduleEarlyWeekNudge(
  nowMs: number,
  skipWeekOf: string | null = null,
): Promise<void> {
  const upcoming = getUpcomingEarlyWeekNudges(
    nowMs,
    EARLY_WEEK_NUDGE_TIMINGS,
    EARLY_WEEK_NUDGE_WEEKS_AHEAD,
    skipWeekOf,
  );

  await Notifications.setNotificationChannelAsync(EARLY_WEEK_NUDGE_CHANNEL_ID, {
    name: platformsCopy.earlyNudgeChannelName,
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await cancelEarlyWeekNudge();

  for (const [position, slot] of upcoming.entries()) {
    const line = EARLY_WEEK_NUDGE_LINES[slot.copyIndex];
    if (!line) continue;
    const { title, body, opens } = line;
    await Notifications.scheduleNotificationAsync({
      identifier: earlyWeekNudgeId(position),
      content: {
        title,
        body,
        sound: true,
        // `opens` routes a tap to Track or the map (see notificationRoute.ts).
        data: { type: EARLY_WEEK_NUDGE_TYPE, opens },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: slot.at,
        channelId: EARLY_WEEK_NUDGE_CHANNEL_ID,
      } as Notifications.DateTriggerInput,
    });
  }
}
