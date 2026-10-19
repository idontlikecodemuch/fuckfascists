import { buildCardFilename, formatCount, formatWeekRange, parseCardWeekOf } from '../utils/formatters';

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

describe('parseCardWeekOf', () => {
  it('reads the scored week back from current and legacy card filenames', () => {
    expect(parseCardWeekOf('Those-I-FCKd-April-11-26.jpg')).toBe('2026-04-11');
    expect(parseCardWeekOf('Those-I-FCKd-April-11-26.png')).toBe('2026-04-11');
    expect(parseCardWeekOf('Those-I-FCKd-January-03-26.jpg')).toBe('2026-01-03');
    expect(parseCardWeekOf('2026-04-11.png')).toBe('2026-04-11');
  });

  it('round-trips buildCardFilename', () => {
    for (const weekOf of ['2026-01-03', '2026-04-11', '2026-10-31', '2027-12-25']) {
      expect(parseCardWeekOf(buildCardFilename(weekOf))).toBe(weekOf);
    }
  });

  it('returns null for names it cannot read', () => {
    expect(parseCardWeekOf('Those-I-FCKd-Smarch-11-26.jpg')).toBeNull();
    expect(parseCardWeekOf('my-card.jpg')).toBeNull();
  });
});
