import { computeDropTime } from '../../../../core/dropSchedule/computeDropTime';
import { getDropAtForScoredWeek, getScoredWeekOfDrop } from '../scoredWeek';

function saturdaysFrom(firstSaturday: string, count: number): string[] {
  const [year, month, day] = firstSaturday.split('-').map(Number);
  return Array.from({ length: count }, (_, index) =>
    new Date(Date.UTC(year, month - 1, day + index * 7)).toISOString().slice(0, 10),
  );
}

function withTimeZone(timeZone: string, run: () => void): void {
  const original = process.env.TZ;
  try {
    process.env.TZ = timeZone;
    run();
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
}

describe('getScoredWeekOfDrop', () => {
  it('maps a Friday drop to the week that ended that Friday', () => {
    const fridayDrop = new Date(2026, 3, 17, 20).getTime();
    expect(getScoredWeekOfDrop(fridayDrop)).toBe('2026-04-11');
  });

  it('keeps Saturday drop-window opens tied to the prior scored week', () => {
    const saturdayDrop = new Date(2026, 3, 18, 17).getTime();
    expect(getScoredWeekOfDrop(saturdayDrop)).toBe('2026-04-11');
  });
});

describe('getDropAtForScoredWeek', () => {
  it('returns the drop of the ISO week holding that scored week\'s Friday', () => {
    // 2026-08-01 → Friday Aug 7 → ISO 2026-W32.
    expect(getDropAtForScoredWeek('2026-08-01')).toBe(computeDropTime(2026, 32).getTime());
    // 2026-12-26 → Friday Jan 1 2027 → ISO 2026-W53.
    expect(getDropAtForScoredWeek('2026-12-26')).toBe(computeDropTime(2026, 53).getTime());
  });

  it.each([
    'America/New_York',
    'America/Los_Angeles',
    'Pacific/Honolulu',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Pacific/Auckland',
  ])('round-trips with getScoredWeekOfDrop in %s, 2026–2040', (timeZone) => {
    withTimeZone(timeZone, () => {
      for (const weekOf of saturdaysFrom('2026-01-03', 52 * 15)) {
        const dropAt = getDropAtForScoredWeek(weekOf);
        expect(dropAt).toBeGreaterThan(Date.parse(`${weekOf}T00:00:00Z`));
        if (getScoredWeekOfDrop(dropAt) !== weekOf) {
          throw new Error(`${weekOf} → ${new Date(dropAt).toISOString()} → ${getScoredWeekOfDrop(dropAt)}`);
        }
        expect(getDropAtForScoredWeek(getScoredWeekOfDrop(dropAt))).toBe(dropAt);
      }
    });
  });
});
