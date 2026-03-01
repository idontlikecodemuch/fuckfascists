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

  it('accepts entities with optional openSecretsOrgId', () => {
    const withOrgId = { ...validEntity, openSecretsOrgId: 'D000000074' };
    const result = parseEntityList([withOrgId]);
    expect(result).toHaveLength(1);
    expect(result[0].openSecretsOrgId).toBe('D000000074');
  });

  it('skips invalid entries while keeping valid ones', () => {
    const invalid = { id: 42 };
    const result = parseEntityList([validEntity, invalid, validEntity]);
    expect(result).toHaveLength(2);
  });
});
