import { getDisplayFigure, getParentEntity } from '../entity';
import type { Entity } from '../entity';

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
