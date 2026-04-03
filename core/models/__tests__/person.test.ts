import { getPersonDisplayName, type PoliticalPerson } from '../person';

describe('PoliticalPerson interface', () => {
  it('accepts a fully populated record', () => {
    const person: PoliticalPerson = {
      id: 'elon-musk',
      canonicalName: 'MUSK, ELON',
      displayName: 'Elon Musk',
      commonName: 'Elon Musk',
      aliases: ['Elon Musk'],
      fecSearchNames: ['MUSK, ELON', 'MUSK, ELON R.'],
      primaryState: 'TX',
      primaryEmployer: 'SPACEX',
      primaryOccupation: 'CEO',
      donorRank: 12,
      tier: 1,
      associatedEntityIds: ['tesla', 'x-twitter', 'spacex'],
      rolesByEntity: {
        tesla: {
          role: 'CEO & Founder',
          startYear: 2008,
          endYear: null,
          benefitBasis: 'executive',
          isCurrent: true,
          ownershipPct: 12.8,
          confidence: 'high',
          notes: 'Current CEO with substantial equity stake.',
        },
        'x-twitter': {
          role: 'Owner',
          startYear: 2022,
          endYear: null,
          benefitBasis: 'control_owner',
          isCurrent: true,
          ownershipPct: null,
          confidence: 'high',
        },
        spacex: {
          role: 'CEO & Founder',
          startYear: 2002,
          endYear: null,
          benefitBasis: 'founder_stake',
          isCurrent: true,
          ownershipPct: null,
          confidence: 'high',
        },
      },
      donationSummary: {
        totalR: 7_000_000,
        totalD: 0,
        recentCycleR: 5_000_000,
        recentCycleD: 0,
        recentCycle: '2023-24',
        activeCycles: [2020, 2022, 2024],
        raw: [
          {
            committeeName: 'AMERICA PAC',
            committeeId: 'C00879510',
            committeeParty: null,
            committeeType: 'O',
            amount: 5_000_000,
            cycle: 2024,
            contributionDate: '2024-08-01',
          },
        ],
        lastUpdated: '2026-04-02',
      },
      verificationStatus: 'pipeline',
      lastVerifiedDate: '2026-04-02',
      notes: 'Also donated via America PAC',
    };

    expect(person.id).toBe('elon-musk');
    expect(person.canonicalName).toBe('MUSK, ELON');
    expect(person.displayName).toBe('Elon Musk');
    expect(person.commonName).toBe('Elon Musk');
    expect(person.aliases).toContain('Elon Musk');
    expect(person.associatedEntityIds).toHaveLength(3);
    expect(person.rolesByEntity['tesla']?.role).toBe('CEO & Founder');
    expect(person.rolesByEntity['tesla']?.benefitBasis).toBe('executive');
    expect(person.rolesByEntity['tesla']?.isCurrent).toBe(true);
    expect(person.donationSummary?.activeCycles).toContain(2024);
    expect(person.fecSearchNames).toContain('MUSK, ELON R.');
    expect(person.primaryEmployer).toBe('SPACEX');
    expect(person.donationSummary?.totalR).toBe(7_000_000);
    expect(person.tier).toBe(1);
  });

  it('accepts a minimal record with only required fields', () => {
    const person: PoliticalPerson = {
      id: 'jane-doe',
      canonicalName: 'DOE, JANE',
      displayName: 'Jane Doe',
      commonName: 'Jane Doe',
      aliases: ['Jane Doe'],
      associatedEntityIds: ['some-corp'],
      rolesByEntity: { 'some-corp': { role: 'CFO', startYear: null, endYear: null } },
      verificationStatus: 'manual',
      lastVerifiedDate: '2026-01-01',
    };

    expect(person.id).toBe('jane-doe');
    expect(person.commonName).toBe('Jane Doe');
    expect(person.fecContributorId).toBeUndefined();
    expect(person.fecSearchNames).toBeUndefined();
    expect(person.primaryState).toBeUndefined();
    expect(person.donorRank).toBeUndefined();
    expect(person.donationSummary).toBeUndefined();
    expect(person.notes).toBeUndefined();
  });

  it('rolesByEntity maps entity ids to role records', () => {
    const person: PoliticalPerson = {
      id: 'test',
      canonicalName: 'PERSON, TEST',
      displayName: 'Test Person',
      commonName: 'Test Person',
      aliases: ['Test Person'],
      associatedEntityIds: ['corp-a', 'corp-b'],
      rolesByEntity: {
        'corp-a': {
          role: 'CEO',
          startYear: 2019,
          endYear: null,
          benefitBasis: 'executive',
          isCurrent: true,
          confidence: 'high',
        },
        'corp-b': {
          role: 'Board Member',
          startYear: 2021,
          endYear: 2024,
          benefitBasis: 'board_material',
          isCurrent: false,
          ownershipPct: 2.3,
          confidence: 'manual-review',
          notes: 'Included because proxy shows meaningful stock ownership.',
        },
      },
      verificationStatus: 'pipeline',
      lastVerifiedDate: '2026-01-01',
    };

    expect(Object.keys(person.rolesByEntity)).toHaveLength(2);
    expect(person.rolesByEntity['corp-a']?.role).toBe('CEO');
    expect(person.rolesByEntity['corp-b']?.role).toBe('Board Member');
    expect(person.rolesByEntity['corp-b']?.isCurrent).toBe(false);
  });

  it('associatedEntityIds is an array of strings', () => {
    const person: PoliticalPerson = {
      id: 'p1',
      canonicalName: 'TEST, PERSON',
      displayName: 'Test Person',
      commonName: 'Test Person',
      aliases: ['Test Person'],
      associatedEntityIds: [],
      rolesByEntity: {},
      verificationStatus: 'unverified',
      lastVerifiedDate: '2026-01-01',
    };

    expect(Array.isArray(person.associatedEntityIds)).toBe(true);
  });

  it('prefers displayName and falls back to canonicalName formatting', () => {
    const aliased: PoliticalPerson = {
      id: 'p2',
      canonicalName: 'MUSK, ELON',
      displayName: 'Elon Musk',
      commonName: 'Elon Musk',
      aliases: ['Elon Musk'],
      associatedEntityIds: [],
      rolesByEntity: {},
      verificationStatus: 'pipeline',
      lastVerifiedDate: '2026-01-01',
    };

    const noAlias: PoliticalPerson = {
      id: 'p3',
      canonicalName: 'SMITH, JANE',
      displayName: '',
      aliases: [],
      associatedEntityIds: [],
      rolesByEntity: {},
      verificationStatus: 'pipeline',
      lastVerifiedDate: '2026-01-01',
    };

    expect(getPersonDisplayName(aliased)).toBe('Elon Musk');
    expect(getPersonDisplayName(noAlias)).toBe('JANE SMITH');
  });
});
