import { getScoredWeekOfDrop } from '../scoredWeek';

describe('getScoredWeekOfDrop', () => {
  it('maps a Friday drop to the week that ended that Friday', () => {
    const fridayDrop = new Date(2026, 3, 17, 20).getTime();
    expect(getScoredWeekOfDrop(fridayDrop)).toBe('2026-04-11');
  });

  it('keeps Saturday drop-window opens tied to the prior scored week', () => {
    const saturdayDrop = new Date(2026, 3, 18, 10).getTime();
    expect(getScoredWeekOfDrop(saturdayDrop)).toBe('2026-04-11');
  });
});
