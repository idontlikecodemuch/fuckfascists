import { fetchPeopleList, parsePeopleList } from '../personList';
import type { PoliticalPerson } from '../../models';

const validPerson: PoliticalPerson = {
  id: 'elon-musk',
  canonicalName: 'MUSK, ELON',
  displayName: 'Elon Musk',
  commonName: 'Elon Musk',
  aliases: ['Elon Musk'],
  associatedEntityIds: ['tesla', 'x-twitter'],
  rolesByEntity: {
    tesla: { role: 'Public Figure', startYear: null, endYear: null },
    'x-twitter': { role: 'Public Figure', startYear: null, endYear: null },
  },
  verificationStatus: 'pipeline',
  lastVerifiedDate: '2026-03-19',
};

const bundled: PoliticalPerson[] = [validPerson];

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('fetchPeopleList', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns the parsed CDN list on a successful fetch', async () => {
    const cdnPerson: PoliticalPerson = {
      ...validPerson,
      id: 'jeff-bezos',
      canonicalName: 'BEZOS, JEFF',
      displayName: 'Jeff Bezos',
      commonName: 'Jeff Bezos',
      aliases: ['Jeff Bezos'],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([cdnPerson]),
    } as Response);

    const result = await fetchPeopleList(bundled);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('jeff-bezos');
  });

  it('falls back to bundled list on a non-ok HTTP response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    const result = await fetchPeopleList(bundled);
    expect(result).toEqual(bundled);
  });

  it('falls back to bundled list on a network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));
    const result = await fetchPeopleList(bundled);
    expect(result).toEqual(bundled);
  });

  it('falls back to bundled list when CDN returns empty array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    const result = await fetchPeopleList(bundled);
    expect(result).toEqual(bundled);
  });
});

describe('parsePeopleList', () => {
  it('returns valid people from a well-formed array', () => {
    const result = parsePeopleList([validPerson]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(validPerson);
  });

  it('accepts the wrapped { _meta, people } format', () => {
    const result = parsePeopleList({ _meta: { totalPeople: 1 }, people: [validPerson] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('elon-musk');
  });

  it('returns empty array for non-array input', () => {
    expect(parsePeopleList(null)).toEqual([]);
    expect(parsePeopleList({})).toEqual([]);
    expect(parsePeopleList('string')).toEqual([]);
  });

  it('skips entries missing canonicalName', () => {
    const bad = { ...validPerson, canonicalName: 42 };
    expect(parsePeopleList([bad])).toHaveLength(0);
  });

  it('skips entries where aliases is not an array', () => {
    const bad = { ...validPerson, aliases: 'Elon Musk' };
    expect(parsePeopleList([bad])).toHaveLength(0);
  });

  it('skips entries missing displayName', () => {
    const bad = { ...validPerson, displayName: 42 };
    expect(parsePeopleList([bad])).toHaveLength(0);
  });

  it('skips entries missing verificationStatus', () => {
    const bad = { ...validPerson, verificationStatus: null };
    expect(parsePeopleList([bad])).toHaveLength(0);
  });

  it('skips entries with invalid role records', () => {
    const bad = {
      ...validPerson,
      rolesByEntity: { tesla: 'CEO' },
    };
    expect(parsePeopleList([bad])).toHaveLength(0);
  });

  it('skips entries with invalid donationSummary payloads', () => {
    const bad = {
      ...validPerson,
      donationSummary: {
        totalGOP: 1,
        totalDEM: 0,
        recentCycleGOP: 1,
        recentCycleDEM: 0,
        recentCycle: '2023-24',
        activeCycles: [2024],
        raw: [{ committeeId: 'C1' }],
        lastUpdated: '2026-03-19',
      },
    };
    expect(parsePeopleList([bad])).toHaveLength(0);
  });

  it('skips invalid entries while keeping valid ones', () => {
    const invalid = { id: 42 };
    const result = parsePeopleList([validPerson, invalid, validPerson]);
    expect(result).toHaveLength(2);
  });
});
