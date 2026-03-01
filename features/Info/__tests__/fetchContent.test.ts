import { fetchInfoContent, isValidInfoContent } from '../data/fetchContent';
import { BUNDLED_CONTENT } from '../data/content';
import type { InfoContent } from '../types';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const VALID_CONTENT: InfoContent = {
  version: '2.0.0',
  about: {
    tagline: 'New tagline',
    description: 'New description',
    organization: 'New org',
    sourceCodeUrl: 'https://github.com/test',
  },
  transparency: [{ id: 'a', title: 'T', body: 'B' }],
  faq: [{ id: 'q1', q: 'Q?', a: 'A.' }],
  links: [{ id: 'l1', label: 'L', url: 'https://example.com', category: 'source' }],
};

// ─── isValidInfoContent ───────────────────────────────────────────────────────

describe('isValidInfoContent', () => {
  it('returns true for a valid payload', () => {
    expect(isValidInfoContent(VALID_CONTENT)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidInfoContent(null)).toBe(false);
  });

  it('returns false when version is missing', () => {
    const { version: _v, ...rest } = VALID_CONTENT;
    expect(isValidInfoContent(rest)).toBe(false);
  });

  it('returns false when about is missing', () => {
    const { about: _a, ...rest } = VALID_CONTENT;
    expect(isValidInfoContent(rest)).toBe(false);
  });

  it('returns false when about.tagline is not a string', () => {
    expect(isValidInfoContent({ ...VALID_CONTENT, about: { ...VALID_CONTENT.about, tagline: 42 } })).toBe(false);
  });

  it('returns false when faq is not an array', () => {
    expect(isValidInfoContent({ ...VALID_CONTENT, faq: 'not-array' })).toBe(false);
  });

  it('returns false when links is not an array', () => {
    expect(isValidInfoContent({ ...VALID_CONTENT, links: null })).toBe(false);
  });

  it('returns false when transparency is not an array', () => {
    expect(isValidInfoContent({ ...VALID_CONTENT, transparency: {} })).toBe(false);
  });
});

// ─── fetchInfoContent ─────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('fetchInfoContent', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns fetched content when the CDN responds with a valid payload', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(VALID_CONTENT) } as Response);
    const result = await fetchInfoContent(BUNDLED_CONTENT);
    expect(result.version).toBe('2.0.0');
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
