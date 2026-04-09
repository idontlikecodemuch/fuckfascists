import { BUNDLED_CONTENT } from '../data/content';

describe('BUNDLED_CONTENT structure', () => {
  it('has a semver-style version string', () => {
    expect(BUNDLED_CONTENT.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('about has all required string fields', () => {
    const { about } = BUNDLED_CONTENT;
    expect(typeof about.tagline).toBe('string');
    expect(typeof about.description).toBe('string');
    expect(typeof about.organization).toBe('string');
    expect(typeof about.sourceCodeUrl).toBe('string');
    expect(about.tagline.length).toBeGreaterThan(0);
    expect(about.description.length).toBeGreaterThan(0);
  });

  it('has at least ten reference entries', () => {
    expect(BUNDLED_CONTENT.reference.length).toBeGreaterThanOrEqual(10);
  });

  it('every reference entry has id, q, a, and a valid category', () => {
    const validCategories = new Set(['data', 'privacy', 'app']);
    BUNDLED_CONTENT.reference.forEach((r) => {
      expect(typeof r.id).toBe('string');
      expect(r.id.length).toBeGreaterThan(0);
      expect(typeof r.q).toBe('string');
      expect(r.q.length).toBeGreaterThan(0);
      expect(typeof r.a).toBe('string');
      expect(r.a.length).toBeGreaterThan(0);
      expect(validCategories.has(r.category)).toBe(true);
    });
  });

  it('reference entry ids are unique', () => {
    const ids = BUNDLED_CONTENT.reference.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has entries in all three categories', () => {
    const categories = new Set(BUNDLED_CONTENT.reference.map((r) => r.category));
    expect(categories.has('data')).toBe(true);
    expect(categories.has('privacy')).toBe(true);
    expect(categories.has('app')).toBe(true);
  });

  it('has at least one link', () => {
    expect(BUNDLED_CONTENT.links.length).toBeGreaterThanOrEqual(1);
  });

  it('every link has id, label, url, and a valid category', () => {
    const validCategories = new Set(['source', 'legal', 'community']);
    BUNDLED_CONTENT.links.forEach((l) => {
      expect(typeof l.id).toBe('string');
      expect(typeof l.label).toBe('string');
      expect(typeof l.url).toBe('string');
      expect(l.url).toMatch(/^https?:\/\//);
      expect(validCategories.has(l.category)).toBe(true);
    });
  });

  it('link ids are unique', () => {
    const ids = BUNDLED_CONTENT.links.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes a mention of FEC in data category entries', () => {
    const dataText = BUNDLED_CONTENT.reference
      .filter((r) => r.category === 'data')
      .map((r) => r.a)
      .join(' ');
    expect(dataText.toLowerCase()).toContain('fec');
  });

  it('includes a tracking reference entry', () => {
    const trackingEntry = BUNDLED_CONTENT.reference.find((r) =>
      r.q.toLowerCase().includes('track')
    );
    expect(trackingEntry).toBeDefined();
  });
});
