import {
  ELECTION_BANNER_DAYS_BEFORE,
  ELECTION_DAYS,
  ELECTION_DAY_REMINDER_HOUR,
  ELECTION_PLAN_REMINDER_DAYS_BEFORE,
  ELECTION_PLAN_REMINDER_HOUR,
  ELECTION_REMINDER_LEAD_DAYS,
} from '../../config/constants';
import { addLocalDays, formatLocalDate } from '../../core/utils/localDate';

export type ElectionBannerPhase = 'before' | 'day';

export interface ElectionReminder {
  /** 'plan' (days ahead) or 'day' (Election Day morning). */
  kind: 'plan' | 'day';
  at: Date;
}

function localDateAt(date: string, hour: number): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

/** The next election day on or after today (local calendar), or null. */
export function getUpcomingElectionDay(
  nowMs: number,
  days: readonly string[] = ELECTION_DAYS,
): string | null {
  const today = formatLocalDate(new Date(nowMs));
  return [...days].sort().find((day) => day >= today) ?? null;
}

/**
 * The reminders for the upcoming election that are still in the future, once
 * it is within ELECTION_REMINDER_LEAD_DAYS.
 */
export function getUpcomingElectionReminders(
  nowMs: number,
  days: readonly string[] = ELECTION_DAYS,
): ElectionReminder[] {
  const day = getUpcomingElectionDay(nowMs, days);
  if (!day || day > addLocalDays(formatLocalDate(new Date(nowMs)), ELECTION_REMINDER_LEAD_DAYS)) return [];
  const reminders: ElectionReminder[] = [
    { kind: 'plan', at: localDateAt(addLocalDays(day, -ELECTION_PLAN_REMINDER_DAYS_BEFORE), ELECTION_PLAN_REMINDER_HOUR) },
    { kind: 'day', at: localDateAt(day, ELECTION_DAY_REMINDER_HOUR) },
  ];
  return reminders.filter((reminder) => reminder.at.getTime() > nowMs);
}

/**
 * Whether the in-app election banner applies today: 'before' from
 * ELECTION_BANNER_DAYS_BEFORE days ahead, 'day' on Election Day, else null.
 */
export function getElectionBannerPhase(
  nowMs: number,
  days: readonly string[] = ELECTION_DAYS,
): ElectionBannerPhase | null {
  const today = formatLocalDate(new Date(nowMs));
  const day = getUpcomingElectionDay(nowMs, days);
  if (!day) return null;
  if (today === day) return 'day';
  return today >= addLocalDays(day, -ELECTION_BANNER_DAYS_BEFORE) ? 'before' : null;
}

/** True when an election day falls in the Sat–Fri week starting `weekOf`. */
export function isElectionWeek(
  weekOf: string,
  days: readonly string[] = ELECTION_DAYS,
): boolean {
  const weekEnd = addLocalDays(weekOf, 7);
  return days.some((day) => day >= weekOf && day < weekEnd);
}
