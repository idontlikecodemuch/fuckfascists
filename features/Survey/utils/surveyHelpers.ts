import type { Platform, SurveyItem } from '../types';

/**
 * Merges the static platform list with the set of platform IDs already
 * recorded as avoided this week. Pure function — no I/O.
 */
export function buildSurveyItems(
  platforms: Platform[],
  avoidedIds: ReadonlySet<string>
): SurveyItem[] {
  return platforms.map((platform) => ({
    platform,
    avoided: avoidedIds.has(platform.id),
  }));
}

/**
 * Formats a YYYY-MM-DD week-of date for display.
 * e.g. "2024-03-11" → "Week of Mar 11"
 */
export function formatWeekOf(weekOf: string): string {
  const date = new Date(`${weekOf}T00:00:00Z`);
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  const day = date.getUTCDate();
  return `Week of ${month} ${day}`;
}
