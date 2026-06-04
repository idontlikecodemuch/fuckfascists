import type { Tab } from './TabBar';

interface TabWeight {
  tab: Tab;
  weight: number;
}

export const INITIAL_TAB_WEIGHTS: readonly TabWeight[] = [
  { tab: 'map', weight: 4 },
  { tab: 'platforms', weight: 3 },
  { tab: 'report', weight: 3 },
  { tab: 'scan', weight: 1 },
];

export function pickInitialTab(
  random: () => number = Math.random,
  weights: readonly TabWeight[] = INITIAL_TAB_WEIGHTS,
): Tab {
  const candidates = weights.filter((item) => item.weight > 0);
  const total = candidates.reduce((sum, item) => sum + item.weight, 0);
  if (total <= 0) return 'map';

  const roll = Math.max(0, Math.min(random(), 0.999999999)) * total;
  let cursor = 0;

  for (const item of candidates) {
    cursor += item.weight;
    if (roll < cursor) return item.tab;
  }

  return candidates[candidates.length - 1]?.tab ?? 'map';
}
