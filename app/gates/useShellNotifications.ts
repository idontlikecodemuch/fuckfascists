import type { StorageAdapter } from '../../core/data';
import type { Entity } from '../../core/models';
import { TRACKED_PLATFORMS } from '../../features/Platforms/data/platformList';
import { useNudgeNotification } from '../../features/Platforms/hooks/useNudgeNotification';
import { useEarlyWeekNudge } from '../../features/Platforms/hooks/useEarlyWeekNudge';
import { useScorecardDropNotification } from '../../features/Scorecard/hooks/useScorecardDropNotification';
import { useElectionReminders } from '../../features/Election/useElectionReminders';

/**
 * Every local notification the app schedules, run from the app shell. Each
 * runs only while notifications are allowed (`enabled`) and again as soon as
 * they are turned on; avoid writes (`refreshKey`) re-run the week-based ones.
 */
export function useShellNotifications(
  adapter: StorageAdapter,
  entities: Entity[],
  refreshKey: number,
  enabled: boolean,
): void {
  useNudgeNotification(enabled);
  useEarlyWeekNudge(adapter, refreshKey, enabled);
  useScorecardDropNotification(adapter, entities, TRACKED_PLATFORMS, refreshKey, enabled);
  useElectionReminders(enabled);
}
