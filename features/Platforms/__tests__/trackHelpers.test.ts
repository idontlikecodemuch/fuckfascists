import {
  buildTodayActions,
  isFigureDefeatedToday,
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

  it('keeps a figure defeated for immediate feedback after a new avoid', () => {
    expect(isFigureDefeatedToday(
      'Jeff Bezos',
      new Set(),
      new Set(['Jeff Bezos']),
    )).toBe(true);
  });
});
