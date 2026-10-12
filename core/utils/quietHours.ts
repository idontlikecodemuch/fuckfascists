import {
  SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR,
  SCORECARD_QUIET_NOTIFICATION_FROM_HOUR,
} from '../../config/constants';

/**
 * True when a local-time hour (0–23) falls inside notification quiet hours:
 * at/after SCORECARD_QUIET_NOTIFICATION_FROM_HOUR or before
 * SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR.
 *
 * Shared by the scorecard drop (scheduled quiet) and the early-week nudge
 * (never scheduled inside quiet hours).
 */
export function isQuietNotificationHour(hour: number): boolean {
  return hour >= SCORECARD_QUIET_NOTIFICATION_FROM_HOUR ||
    hour < SCORECARD_QUIET_NOTIFICATION_BEFORE_HOUR;
}
