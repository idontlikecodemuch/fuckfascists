import { fetchEntityList, parseEntityList } from '../entityList';
import type { Entity } from '../../models';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const validEntity: Entity = {
  id: 'walmart',
  canonicalName: 'Walmart Inc',
  aliases: ['Walmart'],
  domains: ['walmart.com'],
  categoryTags: ['retail'],
  ceoName: 'Doug McMillon',
  verificationStatus: 'unverified',
  lastVerifiedDate: '2024-01-01',
};

const bundled: Entity[] = [validEntity];

// ─── fetchEntityList ──────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('fetchEntityList', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns the parsed CDN list on a successful fetch', async () => {
    const cdnEntity: Entity = { ...validEntity, id: 'target', canonicalName: 'Target Corp' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([cdnEntity]),
    } as Response);

    const result = await fetchEntityList(bundled);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('target');
  });

  it('falls back to bundled list on a non-ok HTTP response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    const result = await fetchEntityList(bundled);
    expect(result).toEqual(bundled);
  });

  it('falls back to bundled list on a network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));
    const result = await fetchEntityList(bundled);
    expect(result).toEqual(bundled);
  });

  it('falls back to bundled list when CDN returns empty array', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    const result = await fetchEntityList(bundled);
    expect(result).toEqual(bundled);
  });

  it('falls back to bundled list when CDN returns invalid JSON shape', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ not: 'an array' }),
    } as Response);

    const result = await fetchEntityList(bundled);
    expect(result).toEqual(bundled);
  });

  it('falls back to bundled list when JSON parsing throws', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    } as unknown as Response);

    const result = await fetchEntityList(bundled);
    expect(result).toEqual(bundled);
  });

  it('does not replace newer local data with an older Git payload', async () => {
    const current = [{ ...validEntity, lastVerifiedDate: '2026-08-20' }];
    const stale = [{ ...validEntity, id: 'stale', lastVerifiedDate: '2026-05-29' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(stale),
    } as Response);

    await expect(fetchEntityList(current)).resolves.toEqual(current);
  });

  it('rejects a suspiciously partial Git payload', async () => {
    const current = Array.from({ length: 10 }, (_, index) => ({
      ...validEntity,
      id: `local-${index}`,
    }));
    const partial = [{ ...validEntity, id: 'remote', lastVerifiedDate: '2026-09-01' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(partial),
    } as Response);

    await expect(fetchEntityList(current)).resolves.toEqual(current);
  });
});

// ─── parseEntityList ──────────────────────────────────────────────────────────

describe('parseEntityList', () => {
  it('returns valid entities from a well-formed array', () => {
    const result = parseEntityList([validEntity]);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(validEntity);
  });

  it('returns empty array for non-array input', () => {
    expect(parseEntityList(null)).toEqual([]);
    expect(parseEntityList({})).toEqual([]);
    expect(parseEntityList('string')).toEqual([]);
  });

  it('skips entries missing required string fields', () => {
    const bad = { ...validEntity, canonicalName: 42 };
    expect(parseEntityList([bad])).toHaveLength(0);
  });

  it('skips entries where id is an empty string', () => {
    const bad = { ...validEntity, id: '' };
    expect(parseEntityList([bad])).toHaveLength(0);
  });

  it('skips entries where aliases is not an array', () => {
    const bad = { ...validEntity, aliases: 'Walmart' };
    expect(parseEntityList([bad])).toHaveLength(0);
  });

  it('accepts entities with optional fecCommitteeId', () => {
    const withCommitteeId = { ...validEntity, fecCommitteeId: 'D000000074' };
    const result = parseEntityList([withCommitteeId]);
    expect(result).toHaveLength(1);
    expect(result[0].fecCommitteeId).toBe('D000000074');
  });

  it('normalizes a verified public figure when a separate CEO is absent', () => {
    const founderLed = {
      ...validEntity,
      id: 'bloomberg',
      ceoName: undefined,
      publicFigureName: 'Michael Bloomberg',
    };
    const result = parseEntityList([founderLed]);

    expect(result).toHaveLength(1);
    expect(result[0].ceoName).toBe('Michael Bloomberg');
    expect(result[0].publicFigureName).toBe('Michael Bloomberg');
  });

  it('still rejects entities with neither a CEO nor a public figure', () => {
    const noFigure = { ...validEntity, ceoName: undefined };
    expect(parseEntityList([noFigure])).toEqual([]);
  });

  it('skips invalid entries while keeping valid ones', () => {
    const invalid = { id: 42 };
    const result = parseEntityList([validEntity, invalid, validEntity]);
    expect(result).toHaveLength(2);
  });
});
