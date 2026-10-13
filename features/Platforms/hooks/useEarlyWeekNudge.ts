import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import type { StorageAdapter } from '../../../core/data';
import { getAllEntityAvoids, getPlatformAvoidsForWeek } from '../../../core/data';
import { addLocalDays, getLocalWeekStartForDate } from '../../../core/utils/localDate';
import { EARLY_WEEK_NUDGE_SKIP_IF_WEEK_ACTIVE } from '../../../config/constants';
import { platformsCopy } from '../../../copy/platforms';
import { getNextEarlyWeekNudge } from '../utils/earlyWeekNudge';
import { EARLY_WEEK_NUDGE_LINES, EARLY_WEEK_NUDGE_TIMINGS } from '../utils/earlyWeekNudgeLines';

/**
 * Stable identifier. Cancels and reschedules touch only this ID, never the
 * Thursday nudge ('platform-nudge-thursday') or the scorecard drop
 * ('scorecard-drop').
 */
export const EARLY_WEEK_NUDGE_ID = 'early-week-nudge';
/** Carried in content.data so the notification can be identified or routed. */
export const EARLY_WEEK_NUDGE_TYPE = 'early-week-nudge';
// Android channel: its own entry in system settings, separate from the
// Thursday nudge, so users can mute one without the other.
const EARLY_WEEK_NUDGE_CHANNEL_ID = 'early-week-nudge';

/**
 * Keeps the next early-week nudge scheduled (one pending notification).
 *
 * Runs at app-shell startup and again after avoid writes (refreshKey), so a
 * week the user has already started gets skipped. Local only: reads this
 * week's avoid rows, stores nothing, makes no network calls. If notification
 * permission is missing or scheduling fails, it silently does nothing.
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

/** Cancels any pending early-week nudge. Touches no other notification. */
export async function cancelEarlyWeekNudge(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(EARLY_WEEK_NUDGE_ID);
  } catch {
    // Nothing scheduled yet; some runtimes throw instead of no-op.
  }
}

/**
 * Replaces the pending early-week nudge with the next one due after `nowMs`,
 * skipping `skipWeekOf`. Scheduling the same week again yields the same time
 * and message, so calling this on every launch is safe.
 */
export async function scheduleEarlyWeekNudge(
  nowMs: number,
  skipWeekOf: string | null = null,
): Promise<void> {
  const next = getNextEarlyWeekNudge(nowMs, EARLY_WEEK_NUDGE_TIMINGS, skipWeekOf);

  await Notifications.setNotificationChannelAsync(EARLY_WEEK_NUDGE_CHANNEL_ID, {
    name: platformsCopy.earlyNudgeChannelName,
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  await cancelEarlyWeekNudge();
  const line = next ? EARLY_WEEK_NUDGE_LINES[next.copyIndex] : undefined;
  if (!next || !line) return;

  const { title, body, opens } = line;
  await Notifications.scheduleNotificationAsync({
    identifier: EARLY_WEEK_NUDGE_ID,
    content: {
      title,
      body,
      sound: true,
      // `opens` routes a tap to Track or the map (see notificationRoute.ts).
      data: { type: EARLY_WEEK_NUDGE_TYPE, opens },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: next.at,
      channelId: EARLY_WEEK_NUDGE_CHANNEL_ID,
    } as Notifications.DateTriggerInput,
  });
}
