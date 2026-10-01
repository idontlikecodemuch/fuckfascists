import assert from 'node:assert/strict';
import test from 'node:test';

import { applyConfiguredPersonMerges } from '../sync-people-from-bulk-top.mjs';

function person(id, overrides = {}) {
  return {
    id,
    canonicalName: id.toUpperCase(),
    displayName: id,
    aliases: [id],
    fecSearchNames: [id.toUpperCase()],
    associatedEntityIds: [],
    rolesByEntity: {},
    donorRank: 10,
    verificationStatus: 'pipeline',
    lastVerifiedDate: '2026-01-01',
    ...overrides,
  };
}

test('configured person merges retain the target id and combine FEC names and entity roles', () => {
  const target = person('sam-bankman-fried', {
    donorRank: 20,
    fecSearchNames: ['BANKMAN-FRIED, SAM'],
  });
  const source = person('samuel-bankman-fried', {
    donorRank: 5,
    canonicalName: 'BANKMAN-FRIED, SAMUEL',
    fecSearchNames: ['BANKMAN-FRIED, SAMUEL'],
    associatedEntityIds: ['ftx'],
    rolesByEntity: {
      ftx: {
        role: 'Founder & Former CEO',
        startYear: 2019,
        endYear: 2022,
        benefitBasis: 'founder_stake',
        isCurrent: false,
        ownershipPct: null,
      },
    },
  });

  const result = applyConfiguredPersonMerges(
    [target, source],
    { 'samuel-bankman-fried': 'sam-bankman-fried' },
  );

  assert.equal(result.people.length, 1);
  assert.equal(result.people[0].id, 'sam-bankman-fried');
  assert.deepEqual(result.people[0].fecSearchNames.sort(), [
    'BANKMAN-FRIED, SAM',
    'BANKMAN-FRIED, SAMUEL',
  ]);
  assert.deepEqual(result.people[0].associatedEntityIds, ['ftx']);
  assert.equal(result.people[0].rolesByEntity.ftx.isCurrent, false);
  assert.deepEqual(result.summaries, [
    { sourceId: 'samuel-bankman-fried', targetId: 'sam-bankman-fried' },
  ]);
});
