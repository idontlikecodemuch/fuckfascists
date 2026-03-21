import type { Platform, PlatformItem } from '../types';

export interface ArenaHitRequest {
  id: number;
  figureName: string;
  delayMs: number;
}

export function buildTodayActions(
  items: PlatformItem[],
  today: string,
  getDisplayFigure: (platform: Platform) => string,
): Set<string> {
  const actions = new Set<string>();

  for (const item of items) {
    if ((item.dayCounts.get(today) ?? 0) > 0) {
      actions.add(getDisplayFigure(item.platform));
    }
  }

  return actions;
}
