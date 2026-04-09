import { fetchInfoContent, isValidInfoContent, buildReferenceFromLegacy } from '../data/fetchContent';
import { BUNDLED_CONTENT } from '../data/content';
import type { InfoContent } from '../types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const VALID_CONTENT_NEW: InfoContent = {
  version: '2.0.0',
  about: {
    tagline: 'New tagline',
    description: 'New description',
    organization: 'New org',
    ethosTitle: 'Test ethos title',
    ethos: 'Test ethos body',
    sourceCodeUrl: 'https://github.com/test',
  },
  reference: [{ id: 'r1', q: 'Q?', a: 'A.', category: 'data' }],
  links: [{ id: 'l1', label: 'L', url: 'https://example.com', category: 'source' }],
};

/** Legacy payload with transparency+faq but no reference */
const VALID_CONTENT_LEGACY = {
  version: '1.0.0',
  about: VALID_CONTENT_NEW.about,
  transparency: [{ id: 'storage', title: 'Storage?', body: 'Answer.' }],
  faq: [{ id: 'trust', q: 'Trust?', a: 'Yes.' }],
  links: VALID_CONTENT_NEW.links,
};

// ─── isValidInfoContent ───────────────────────────────────────────────────────

describe('isValidInfoContent', () => {
  it('returns true for a new-schema payload with reference[]', () => {
    expect(isValidInfoContent(VALID_CONTENT_NEW)).toBe(true);
  });

  it('returns true for a legacy payload with transparency+faq', () => {
    expect(isValidInfoContent(VALID_CONTENT_LEGACY)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidInfoContent(null)).toBe(false);
  });

  it('returns false when version is missing', () => {
    const { version: _v, ...rest } = VALID_CONTENT_NEW;
    expect(isValidInfoContent(rest)).toBe(false);
  });

  it('returns false when about is missing', () => {
    const { about: _a, ...rest } = VALID_CONTENT_NEW;
    expect(isValidInfoContent(rest)).toBe(false);
  });

  it('returns false when about.tagline is not a string', () => {
    expect(isValidInfoContent({ ...VALID_CONTENT_NEW, about: { ...VALID_CONTENT_NEW.about, tagline: 42 } })).toBe(false);
  });

  it('returns false when links is not an array', () => {
    expect(isValidInfoContent({ ...VALID_CONTENT_NEW, links: null })).toBe(false);
  });

  it('returns false when neither reference nor transparency+faq are present', () => {
    const { reference: _r, ...rest } = VALID_CONTENT_NEW;
    expect(isValidInfoContent(rest)).toBe(false);
  });
});

// ─── buildReferenceFromLegacy ────────────────────────────────────────────────

describe('buildReferenceFromLegacy', () => {
  it('maps transparency items to data category by default', () => {
    const result = buildReferenceFromLegacy(
      [{ id: 'data-source', title: 'Source?', body: 'FEC.' }],
      [],
    );
    expect(result).toEqual([{ id: 'data-source', q: 'Source?', a: 'FEC.', category: 'data' }]);
  });

  it('maps storage and tracking transparency items to privacy category', () => {
    const result = buildReferenceFromLegacy(
      [{ id: 'storage', title: 'Storage?', body: 'Local.' }],
      [],
    );
    expect(result[0].category).toBe('privacy');
  });

  it('maps faq items to app category by default', () => {
    const result = buildReferenceFromLegacy(
      [],
      [{ id: 'trust', q: 'Trust?', a: 'Yes.' }],
    );
    expect(result).toEqual([{ id: 'trust', q: 'Trust?', a: 'Yes.', category: 'app' }]);
  });

  it('maps tracking faq item to privacy category', () => {
    const result = buildReferenceFromLegacy(
      [],
      [{ id: 'tracking', q: 'Track?', a: 'No.' }],
    );
    expect(result[0].category).toBe('privacy');
  });
});

// ─── fetchInfoContent ─────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('fetchInfoContent', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns fetched content when the CDN responds with a new-schema payload', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(VALID_CONTENT_NEW) } as Response);
    const result = await fetchInfoContent(BUNDLED_CONTENT);
    expect(result.version).toBe('2.0.0');
    expect(result.reference).toHaveLength(1);
  });

  it('converts legacy payload to new schema with reference[]', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(VALID_CONTENT_LEGACY) } as Response);
    const result = await fetchInfoContent(BUNDLED_CONTENT);
    expect(result.reference).toBeDefined();
    expect(result.reference.length).toBeGreaterThan(0);
    expect(result.reference[0].category).toBe('privacy'); // 'storage' → privacy
  });

  it('falls back to bundled content on a non-ok HTTP response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 } as Response);
    const result = await fetchInfoContent(BUNDLED_CONTENT);
    expect(result).toBe(BUNDLED_CONTENT);
  });

  it('falls back to bundled content on a network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));
    const result = await fetchInfoContent(BUNDLED_CONTENT);
    expect(result).toBe(BUNDLED_CONTENT);
  });

  it('falls back to bundled content when the payload fails validation', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ bad: 'payload' }) } as Response);
    const result = await fetchInfoContent(BUNDLED_CONTENT);
    expect(result).toBe(BUNDLED_CONTENT);
  });

  it('falls back to bundled content when JSON parsing throws', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    } as unknown as Response);
    const result = await fetchInfoContent(BUNDLED_CONTENT);
    expect(result).toBe(BUNDLED_CONTENT);
  });
});
