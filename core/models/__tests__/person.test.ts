import type { PoliticalPerson } from '../person';

// ── Type-shape validation ─────────────────────────────────────────────────────
// These tests confirm the interface contract is satisfied at compile time
// by constructing valid and minimal PoliticalPerson objects.

describe('PoliticalPerson interface', () => {
  it('accepts a fully populated record', () => {
    const person: PoliticalPerson = {
      id: 'elon-musk',
      name: 'Elon Musk',
      fecContributorId: 'ABC123',
      associatedEntityIds: ['tesla', 'x-twitter', 'spacex'],
      rolesByEntity: {
        tesla: 'CEO & Founder',
        'x-twitter': 'Owner',
        spacex: 'CEO & Founder',
      },
      totalIndividualRepubs: 7_000_000,
      totalIndividualDems: 0,
      activeCycles: [2020, 2022, 2024],
      lastVerifiedDate: '2026-03-05',
      notes: 'Also donated via America PAC',
    };

    expect(person.id).toBe('elon-musk');
    expect(person.name).toBe('Elon Musk');
    expect(person.associatedEntityIds).toHaveLength(3);
    expect(person.rolesByEntity['tesla']).toBe('CEO & Founder');
    expect(person.activeCycles).toContain(2024);
  });

  it('accepts a minimal record with only required fields', () => {
    const person: PoliticalPerson = {
      id: 'jane-doe',
      name: 'Doe, Jane',
      associatedEntityIds: ['some-corp'],
      rolesByEntity: { 'some-corp': 'CFO' },
      lastVerifiedDate: '2026-01-01',
    };

    expect(person.id).toBe('jane-doe');
    expect(person.fecContributorId).toBeUndefined();
    expect(person.totalIndividualRepubs).toBeUndefined();
    expect(person.totalIndividualDems).toBeUndefined();
    expect(person.activeCycles).toBeUndefined();
    expect(person.notes).toBeUndefined();
  });

  it('rolesByEntity maps entity ids to role strings', () => {
    const person: PoliticalPerson = {
      id: 'test',
      name: 'Test Person',
      associatedEntityIds: ['corp-a', 'corp-b'],
      rolesByEntity: { 'corp-a': 'CEO', 'corp-b': 'Board Member' },
      lastVerifiedDate: '2026-01-01',
    };

    expect(Object.keys(person.rolesByEntity)).toHaveLength(2);
    expect(person.rolesByEntity['corp-a']).toBe('CEO');
    expect(person.rolesByEntity['corp-b']).toBe('Board Member');
  });

  it('associatedEntityIds is an array of strings', () => {
    const person: PoliticalPerson = {
      id: 'p1',
      name: 'Test',
      associatedEntityIds: [],
      rolesByEntity: {},
      lastVerifiedDate: '2026-01-01',
    };

    expect(Array.isArray(person.associatedEntityIds)).toBe(true);
  });
});
