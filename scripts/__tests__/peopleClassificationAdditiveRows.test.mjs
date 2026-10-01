import assert from 'node:assert/strict';
import test from 'node:test';

import { stripPriorAdditiveRows } from '../build-people-classification-preview.mjs';

test('classification refresh replaces prior additive source rows', () => {
  const rows = [
    { committeeId: 'bulk', amount: 10 },
    { committeeId: 'old-inaugural', amount: 20, sourceKind: 'inaugural_f13' },
    { committeeId: 'other-addon', amount: 30, sourceKind: 'some_other_source' },
  ];

  assert.deepEqual(
    stripPriorAdditiveRows(rows, new Set(['inaugural_f13'])),
    [
      { committeeId: 'bulk', amount: 10 },
      { committeeId: 'other-addon', amount: 30, sourceKind: 'some_other_source' },
    ],
  );
});
