import { getDisplayFigure, getParentEntity, getAssociatedPeople } from '../entity';
import type { Entity } from '../entity';
import type { PoliticalPerson } from '../person';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeEntity(overrides: Partial<Entity> & { id: string; ceoName: string }): Entity {
  return {
    canonicalName: overrides.id,
    aliases: [],
    domains: [],
    categoryTags: [],
    verificationStatus: 'unverified',
    lastVerifiedDate: '2026-01-01',
    ...overrides,
  };
}

const meta = makeEntity({
  id: 'meta',
  ceoName: 'Mark Zuckerberg',
  publicFigureName: 'Mark Zuckerberg',
});

const instagram = makeEntity({
  id: 'instagram',
  ceoName: 'Adam Mosseri',
  parentEntityId: 'meta',
});

const microsoft = makeEntity({
  id: 'microsoft',
  ceoName: 'Satya Nadella',
});

const linkedin = makeEntity({
  id: 'linkedin',
  ceoName: 'Ryan Roslansky',
  parentEntityId: 'microsoft',
});

const noParentMatch = makeEntity({
  id: 'orphan',
  ceoName: 'Unknown CEO',
  parentEntityId: 'nonexistent-parent',
});

const allEntities = [meta, instagram, microsoft, linkedin, noParentMatch];

// ── getDisplayFigure ──────────────────────────────────────────────────────────

describe('getDisplayFigure', () => {
  describe('without allEntities (backward-compatible behaviour)', () => {
    it('returns publicFigureName when set', () => {
      const entity = makeEntity({ id: 'x', ceoName: 'Linda Yaccarino', publicFigureName: 'Elon Musk' });
      expect(getDisplayFigure(entity)).toBe('Elon Musk');
    });

    it('falls back to ceoName when publicFigureName is absent', () => {
      const entity = makeEntity({ id: 'y', ceoName: 'Jeff Jones' });
      expect(getDisplayFigure(entity)).toBe('Jeff Jones');
    });

    it('ignores parentEntityId when allEntities is omitted', () => {
      expect(getDisplayFigure(instagram)).toBe('Adam Mosseri');
    });
  });

  describe('with allEntities — parent resolution', () => {
    it('returns parent publicFigureName when parentEntityId resolves', () => {
      expect(getDisplayFigure(instagram, allEntities)).toBe('Mark Zuckerberg');
    });

    it('returns parent ceoName when parent has no publicFigureName', () => {
      expect(getDisplayFigure(linkedin, allEntities)).toBe('Satya Nadella');
    });

    it('falls back to own publicFigureName/ceoName when parent not found', () => {
      expect(getDisplayFigure(noParentMatch, allEntities)).toBe('Unknown CEO');
    });

    it('returns own figure when entity has no parentEntityId', () => {
      expect(getDisplayFigure(meta, allEntities)).toBe('Mark Zuckerberg');
    });

    it('uses own figure when allEntities is an empty array', () => {
      expect(getDisplayFigure(instagram, [])).toBe('Adam Mosseri');
    });
  });
});

// ── getParentEntity ───────────────────────────────────────────────────────────

describe('getParentEntity', () => {
  it('returns the parent entity when parentEntityId is set and found', () => {
    expect(getParentEntity(instagram, allEntities)).toBe(meta);
  });

  it('returns the correct parent for a different subsidiary', () => {
    expect(getParentEntity(linkedin, allEntities)).toBe(microsoft);
  });

  it('returns undefined when entity has no parentEntityId', () => {
    expect(getParentEntity(meta, allEntities)).toBeUndefined();
    expect(getParentEntity(microsoft, allEntities)).toBeUndefined();
  });

  it('returns undefined when parentEntityId does not match any entity', () => {
    expect(getParentEntity(noParentMatch, allEntities)).toBeUndefined();
  });

  it('returns undefined when allEntities is empty', () => {
    expect(getParentEntity(instagram, [])).toBeUndefined();
  });
});

// ── getAssociatedPeople ─────────────────────────────────────────────────────

const makePerson = (overrides: Partial<PoliticalPerson> & { id: string }): PoliticalPerson => ({
  canonicalName: 'LAST, FIRST',
  displayName: overrides.id,
  aliases: [],
  associatedEntityIds: [],
  rolesByEntity: {},
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2026-01-01',
  donationSummary: {
    totalR: 1_000,
    totalD: 500,
    recentCycleR: 500,
    recentCycleD: 200,
    recentCycle: '2023-24',
    activeCycles: [2024],
    raw: [],
    lastUpdated: '2026-04-01',
  },
  ...overrides,
});

describe('getAssociatedPeople', () => {
  it('returns people matching associatedPersonIds', () => {
    const entity = makeEntity({ id: 'amazon', ceoName: 'Andy Jassy', associatedPersonIds: ['bezos'] });
    const people = [makePerson({ id: 'bezos' })];
    const result = getAssociatedPeople(entity, people);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('bezos');
  });

  it('returns empty array when no associatedPersonIds', () => {
    expect(getAssociatedPeople(meta, [makePerson({ id: 'bezos' })])).toHaveLength(0);
  });

  it('includes parent entity associated people for subsidiaries', () => {
    const parent = makeEntity({ id: 'parent-co', ceoName: 'Boss', associatedPersonIds: ['founder'] });
    const child = makeEntity({ id: 'child-co', ceoName: 'Manager', parentEntityId: 'parent-co' });
    const founder = makePerson({ id: 'founder' });
    const result = getAssociatedPeople(child, [founder], [parent, child]);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('founder');
  });

  it('deduplicates when entity and parent share a person', () => {
    const parent = makeEntity({ id: 'parent-co', ceoName: 'Boss', associatedPersonIds: ['shared'] });
    const child = makeEntity({ id: 'child-co', ceoName: 'Manager', parentEntityId: 'parent-co', associatedPersonIds: ['shared'] });
    const person = makePerson({ id: 'shared' });
    const result = getAssociatedPeople(child, [person], [parent, child]);
    expect(result).toHaveLength(1);
  });

  it('skips people without donationSummary', () => {
    const entity = makeEntity({ id: 'co', ceoName: 'CEO', associatedPersonIds: ['has-data', 'no-data'] });
    const people = [
      makePerson({ id: 'has-data' }),
      makePerson({ id: 'no-data', donationSummary: undefined }),
    ];
    const result = getAssociatedPeople(entity, people);
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('has-data');
  });

  it('returns empty array when person IDs do not match', () => {
    const entity = makeEntity({ id: 'co', ceoName: 'CEO', associatedPersonIds: ['nonexistent'] });
    expect(getAssociatedPeople(entity, [makePerson({ id: 'someone-else' })])).toHaveLength(0);
  });
});
