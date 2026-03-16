import { formatWeekOf } from '../utils/platformHelpers';

describe('formatWeekOf', () => {
  it('formats a Monday date as "Mon D"', () => {
    expect(formatWeekOf('2024-03-11')).toBe('Mar 11');
  });

  it('formats January 1 correctly', () => {
    expect(formatWeekOf('2024-01-01')).toBe('Jan 1');
  });

  it('formats December correctly', () => {
    expect(formatWeekOf('2024-12-02')).toBe('Dec 2');
  });

  it('does not add a leading zero to single-digit days', () => {
    const result = formatWeekOf('2024-03-04');
    expect(result).toBe('Mar 4');
    expect(result).not.toContain('04');
  });

  it('formats a mid-year date correctly', () => {
    expect(formatWeekOf('2024-06-17')).toBe('Jun 17');
  });
});
