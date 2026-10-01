import assert from 'node:assert/strict';
import test from 'node:test';

import { removePriorInherentlyPartisanTotals } from '../build-entities-classification-preview.mjs';

test('entity classification refresh subtracts the previous additive ledger', () => {
  const summary = {
    totalRepubs: 150,
    totalDems: 80,
    recentCycle: 2026,
    recentRepubs: 120,
    recentDems: 50,
    recentO: 5,
    activeCycles: [2024, 2026],
    cycleTotals: [
      [2024, 30, 30, 0],
      [2026, 120, 50, 5],
    ],
    inherentlyPartisanCycleTotals: [[2026, 100, 20]],
    raw: [],
  };

  assert.deepEqual(removePriorInherentlyPartisanTotals(summary), {
    ...summary,
    totalRepubs: 50,
    totalDems: 60,
    recentCycle: 2026,
    recentRepubs: 20,
    recentDems: 30,
    recentO: 5,
    activeCycles: [2024, 2026],
    cycleTotals: [
      [2024, 30, 30, 0],
      [2026, 20, 30, 5],
    ],
    inherentlyPartisanCycleTotals: [],
  });
});
