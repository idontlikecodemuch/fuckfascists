import {
  ARENA_DEFEAT_CHANCE_TODAY,
  buildTodayActions,
  isFigureDefeated,
  rollArenaDefeat,
} from '../context/trackHelpers';
import type { Platform, PlatformItem } from '../types';

function platform(id: string, figureName: string): Platform {
  return {
    id,
    name: id,
    ceoName: figureName,
    entityId: id,
    parentCompany: id,
    categoryTags: [],
    sortOrder: 0,
    defaultSelected: true,
  };
}

function item(id: string, figureName: string, dayCounts: [string, number][]): PlatformItem {
  return {
    platform: platform(id, figureName),
    weeklyCount: dayCounts.reduce((sum, [, count]) => sum + count, 0),
    dayCounts: new Map(dayCounts),
  };
}

describe('trackHelpers', () => {
  it('builds defeated actions only from today, not earlier weekly avoids', () => {
    const actions = buildTodayActions(
      [
        item('meta', 'Mark Zuckerberg', [['2026-05-28', 1]]),
        item('x', 'Elon Musk', [['2026-05-29', 1]]),
      ],
      '2026-05-29',
      (p) => p.ceoName,
    );

    expect(actions.has('Mark Zuckerberg')).toBe(false);
    expect(actions.has('Elon Musk')).toBe(true);
  });

  it('keeps recorded avoids separate from defeated sprite state', () => {
    const actions = buildTodayActions(
      [
        item('youtube', 'Sundar Pichai', [['2026-06-24', 1]]),
      ],
      '2026-06-24',
      (p) => p.ceoName,
    );

    expect(actions.has('Sundar Pichai')).toBe(true);
    expect(isFigureDefeated('Sundar Pichai', new Set())).toBe(false);
  });

  it('registers only figures whose visual hit defeated them', () => {
    expect(isFigureDefeated('Jeff Bezos', new Set(['Jeff Bezos']))).toBe(true);
    expect(isFigureDefeated('Elon Musk', new Set(['Jeff Bezos']))).toBe(false);
  });

  it('uses an exact 50 percent threshold for visual defeats', () => {
    expect(rollArenaDefeat(() => 0)).toBe(true);
    expect(rollArenaDefeat(() => 0.499999)).toBe(true);
    expect(rollArenaDefeat(() => 0.5)).toBe(false);
    expect(rollArenaDefeat(() => 0.999999)).toBe(false);
  });

  it('rolls same-day avoids at the higher today threshold', () => {
    expect(ARENA_DEFEAT_CHANCE_TODAY).toBe(0.8);
    expect(rollArenaDefeat(() => 0.799999, ARENA_DEFEAT_CHANCE_TODAY)).toBe(true);
    expect(rollArenaDefeat(() => 0.8, ARENA_DEFEAT_CHANCE_TODAY)).toBe(false);
    expect(rollArenaDefeat(() => 0.6)).toBe(false);
  });
});
