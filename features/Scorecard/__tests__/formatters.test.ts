import { formatCount, formatWeekRange } from '../utils/formatters';

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
  it('formats a standard week in uppercase with em dash', () => {
    const result = formatWeekRange('2024-03-11');
    expect(result).toContain('\u2014'); // em dash
    expect(result).toMatch(/^MAR/);
  });

  it('handles month-crossing weeks', () => {
    const result = formatWeekRange('2024-03-25');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles year-end weeks', () => {
    const result = formatWeekRange('2024-12-30');
    expect(typeof result).toBe('string');
  });

  it('always contains an em dash', () => {
    expect(formatWeekRange('2024-06-17')).toContain('\u2014');
  });

  it('returns uppercase month names', () => {
    expect(formatWeekRange('2024-01-01')).toMatch(/^JAN/);
  });
});
