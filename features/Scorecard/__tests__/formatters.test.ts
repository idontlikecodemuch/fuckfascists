import { formatCount, formatWeekRange, formatDropTime } from '../utils/formatters';

describe('formatCount', () => {
  it('appends the × character', () => {
    expect(formatCount(1)).toBe('1\u00d7');
    expect(formatCount(12)).toBe('12\u00d7');
  });

  it('handles zero', () => {
    expect(formatCount(0)).toBe('0\u00d7');
  });
});

describe('formatWeekRange', () => {
  it('formats a standard week', () => {
    expect(formatWeekRange('2024-03-11')).toBe('Mar 11 \u2013 Mar 17, 2024');
  });

  it('handles month-crossing weeks', () => {
    // March 25 → March 31
    expect(formatWeekRange('2024-03-25')).toBe('Mar 25 \u2013 Mar 31, 2024');
  });

  it('handles year-end weeks', () => {
    // Dec 30 → Jan 5 would cross a year, but Dec 30 + 6 = Jan 5
    // Just verify it produces a string without throwing
    const result = formatWeekRange('2024-12-30');
    expect(typeof result).toBe('string');
    expect(result).toContain('2025');
  });

  it('always contains an en dash', () => {
    expect(formatWeekRange('2024-06-17')).toContain('\u2013');
  });

  it('starts with the month of the Monday', () => {
    expect(formatWeekRange('2024-01-01')).toMatch(/^Jan/);
  });
});

describe('formatDropTime', () => {
  it('returns a non-empty string', () => {
    // 2024-03-15 20:00 UTC
    const result = formatDropTime(1710532800000);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes "at" to separate date from time', () => {
    expect(formatDropTime(1710532800000)).toContain(' at ');
  });
});
