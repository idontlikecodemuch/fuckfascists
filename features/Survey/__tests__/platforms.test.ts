import { TRACKED_PLATFORMS } from '../data/platforms';

describe('TRACKED_PLATFORMS', () => {
  it('contains at least one platform', () => {
    expect(TRACKED_PLATFORMS.length).toBeGreaterThan(0);
  });

  it('every platform has a non-empty id', () => {
    TRACKED_PLATFORMS.forEach((p) => {
      expect(typeof p.id).toBe('string');
      expect(p.id.length).toBeGreaterThan(0);
    });
  });

  it('every platform has a non-empty name', () => {
    TRACKED_PLATFORMS.forEach((p) => expect(p.name.length).toBeGreaterThan(0));
  });

  it('every platform has a non-empty parentCompany', () => {
    TRACKED_PLATFORMS.forEach((p) => expect(p.parentCompany.length).toBeGreaterThan(0));
  });

  it('every platform has a non-empty ceoName', () => {
    TRACKED_PLATFORMS.forEach((p) => expect(p.ceoName.length).toBeGreaterThan(0));
  });

  it('every platform has at least one categoryTag', () => {
    TRACKED_PLATFORMS.forEach((p) => expect(p.categoryTags.length).toBeGreaterThan(0));
  });

  it('all platform ids are unique', () => {
    const ids = TRACKED_PLATFORMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('no platform has a confidenceOverride field', () => {
    TRACKED_PLATFORMS.forEach((p) => {
      expect((p as unknown as Record<string, unknown>)['confidenceOverride']).toBeUndefined();
    });
  });
});
