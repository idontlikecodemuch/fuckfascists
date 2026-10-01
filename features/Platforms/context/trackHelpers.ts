import type { Platform, PlatformItem } from '../types';

export interface ArenaHitRequest {
  id: number;
  figureName: string;
  delayMs: number;
}

// Back-dated day circles, ✓ re-presses and direct arena taps roll at the base
// chance; a same-day AVOID tap rolls at the higher today chance.
export const ARENA_DEFEAT_CHANCE = 0.5;
export const ARENA_DEFEAT_CHANCE_TODAY = 0.8;

export function rollArenaDefeat(
  random: () => number = Math.random,
  chance: number = ARENA_DEFEAT_CHANCE,
): boolean {
  return random() < chance;
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

export function isFigureDefeated(
  figureName: string,
  defeatedFigures: Set<string>,
): boolean {
  return defeatedFigures.has(figureName);
}
