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

  it('has at least three transparency points', () => {
    expect(BUNDLED_CONTENT.transparency.length).toBeGreaterThanOrEqual(3);
  });

  it('every transparency point has id, title, and body', () => {
    BUNDLED_CONTENT.transparency.forEach((p) => {
      expect(typeof p.id).toBe('string');
      expect(p.id.length).toBeGreaterThan(0);
      expect(typeof p.title).toBe('string');
      expect(typeof p.body).toBe('string');
    });
  });

  it('transparency point ids are unique', () => {
    const ids = BUNDLED_CONTENT.transparency.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has at least five FAQ entries', () => {
    expect(BUNDLED_CONTENT.faq.length).toBeGreaterThanOrEqual(5);
  });

  it('every FAQ entry has id, q, and a', () => {
    BUNDLED_CONTENT.faq.forEach((f) => {
      expect(typeof f.id).toBe('string');
      expect(f.id.length).toBeGreaterThan(0);
      expect(typeof f.q).toBe('string');
      expect(f.q.length).toBeGreaterThan(0);
      expect(typeof f.a).toBe('string');
      expect(f.a.length).toBeGreaterThan(0);
    });
  });

  it('FAQ ids are unique', () => {
    const ids = BUNDLED_CONTENT.faq.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
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

  it('includes a mention of FEC in transparency', () => {
    const text = BUNDLED_CONTENT.transparency.map((p) => p.body).join(' ');
    expect(text.toLowerCase()).toContain('fec');
  });

  it('includes a tracking FAQ entry', () => {
    const trackingEntry = BUNDLED_CONTENT.faq.find((f) =>
      f.q.toLowerCase().includes('track')
    );
    expect(trackingEntry).toBeDefined();
  });
});
