import {
  getElectionBannerPhase,
  getUpcomingElectionDay,
  getUpcomingElectionReminders,
  isElectionWeek,
} from '../electionDays';
import { getUpcomingEarlyWeekNudges } from '../../Platforms/utils/earlyWeekNudge';
import { EARLY_WEEK_NUDGE_TIMINGS } from '../../Platforms/utils/earlyWeekNudgeLines';

const DAYS = ['2026-11-03', '2028-11-07'];
/** Local wall-clock time in November 2026 (month index 10). */
const nov = (day: number, hour = 12, minute = 0) => new Date(2026, 10, day, hour, minute).getTime();

describe('election days', () => {
  it('finds the next election on or after today', () => {
    expect(getUpcomingElectionDay(new Date(2026, 9, 26, 9).getTime(), DAYS)).toBe('2026-11-03');
    expect(getUpcomingElectionDay(nov(3, 23), DAYS)).toBe('2026-11-03');
    expect(getUpcomingElectionDay(nov(4, 0, 1), DAYS)).toBe('2028-11-07');
    expect(getUpcomingElectionDay(new Date(2029, 0, 1).getTime(), DAYS)).toBeNull();
  });

  it('schedules Sunday 6pm and Election Day 8am, local time', () => {
    const reminders = getUpcomingElectionReminders(new Date(2026, 9, 26, 9).getTime(), DAYS);
    expect(reminders.map((r) => [r.kind, r.at.getTime()])).toEqual([
      ['plan', nov(1, 18)],
      ['day', nov(3, 8)],
    ]);
    expect(new Date(nov(1, 18)).getDay()).toBe(0); // Sunday
  });

  it('queues nothing until the election is within 30 days', () => {
    expect(getUpcomingElectionReminders(new Date(2026, 9, 3, 9).getTime(), DAYS)).toEqual([]);
    expect(getUpcomingElectionReminders(nov(4, 9), DAYS)).toEqual([]); // 2028 is years away
    expect(getUpcomingElectionReminders(new Date(2026, 9, 5, 9).getTime(), DAYS)).toHaveLength(2);
  });

  it('drops reminders whose time has passed', () => {
    expect(getUpcomingElectionReminders(nov(1, 18, 1), DAYS).map((r) => r.kind)).toEqual(['day']);
    expect(getUpcomingElectionReminders(nov(3, 8, 1), DAYS)).toEqual([]);
  });

  it('shows the banner Sunday through Election Day only', () => {
    expect(getElectionBannerPhase(new Date(2026, 9, 31, 23, 59).getTime(), DAYS)).toBeNull();
    expect(getElectionBannerPhase(nov(1, 0, 1), DAYS)).toBe('before');
    expect(getElectionBannerPhase(nov(2, 22), DAYS)).toBe('before');
    expect(getElectionBannerPhase(nov(3, 6), DAYS)).toBe('day');
    expect(getElectionBannerPhase(nov(4, 9), DAYS)).toBeNull();
  });

  it('knows the Sat–Fri election week', () => {
    expect(isElectionWeek('2026-10-31', DAYS)).toBe(true);
    expect(isElectionWeek('2026-10-24', DAYS)).toBe(false);
    expect(isElectionWeek('2026-11-07', DAYS)).toBe(false);
  });

  it('skips the early-week nudge in election week', () => {
    const slots = getUpcomingEarlyWeekNudges(new Date(2026, 9, 25, 9).getTime(), EARLY_WEEK_NUDGE_TIMINGS, 3);
    expect(slots.map((s) => s.weekOf)).toEqual(['2026-10-24', '2026-11-07', '2026-11-14']);
  });
});
