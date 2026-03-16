import { getLocalDateString } from '../../../core/utils/localDate';

/**
 * Computes the 7 date strings (Mon–Sun) for the week starting on `weekOf`.
 * Returns YYYY-MM-DD strings in order: Monday, Tuesday, ..., Sunday.
 */
export function getWeekDates(weekOf: string): string[] {
  const dates: string[] = [];
  const base = new Date(`${weekOf}T00:00:00Z`);
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}

/** Returns true if the given YYYY-MM-DD date is in the future (after today). */
export function isFutureDate(date: string): boolean {
  return date > getLocalDateString();
}
