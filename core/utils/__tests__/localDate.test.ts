import { getLocalDateString, getLocalWeekStart } from '../localDate';

describe('getLocalDateString', () => {
  it('returns a string matching YYYY-MM-DD format', () => {
    expect(getLocalDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a parseable date that is today', () => {
    const result = getLocalDateString();
    const parsed = new Date(result + 'T00:00:00');
    const now = new Date();
    // Year, month, and day must match the local clock.
    expect(parsed.getFullYear()).toBe(now.getFullYear());
    expect(parsed.getMonth()).toBe(now.getMonth());
    expect(parsed.getDate()).toBe(now.getDate());
  });
});

describe('getLocalWeekStart', () => {
  it('returns a string matching YYYY-MM-DD format', () => {
    expect(getLocalWeekStart()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('always returns a Monday', () => {
    const result = getLocalWeekStart();
    // Parsing as local midnight to check the weekday.
    const parsed = new Date(result + 'T00:00:00');
    expect(parsed.getDay()).toBe(1); // 1 = Monday
  });

  it('returned date is within the last 6 days', () => {
    const result = getLocalWeekStart();
    const parsed = new Date(result + 'T00:00:00');
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((todayMidnight.getTime() - parsed.getTime()) / 86_400_000);
    expect(diffDays).toBeGreaterThanOrEqual(0);
    expect(diffDays).toBeLessThanOrEqual(6);
  });
});
