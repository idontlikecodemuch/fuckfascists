import { toAreaHash } from '../utils/areaHash';

describe('toAreaHash', () => {
  it('returns a string in lat,lng format', () => {
    const hash = toAreaHash(37.7749, -122.4194);
    expect(typeof hash).toBe('string');
    expect(hash).toContain(',');
  });

  it('rounds to 2 decimal places (~1km grid)', () => {
    expect(toAreaHash(37.7749, -122.4194)).toBe('37.77,-122.42');
  });

  it('two points in the same ~1km grid produce the same hash', () => {
    // Both coordinates are clearly within the same cell (37.77xx rounds to 37.77,
    // -122.41xx rounds to -122.41). The original fixture straddled the 37.775
    // rounding boundary (37.7749 → 37.77, 37.7752 → 37.78), so it picked two
    // different cells despite being only ~30m apart.
    const a = toAreaHash(37.7701, -122.4101);
    const b = toAreaHash(37.7748, -122.4148);
    expect(a).toBe(b);
  });

  it('two points in different grid cells produce different hashes', () => {
    const a = toAreaHash(37.77, -122.41);
    const b = toAreaHash(37.78, -122.42);
    expect(a).not.toBe(b);
  });

  it('handles negative latitudes (Southern Hemisphere)', () => {
    expect(toAreaHash(-33.87, 151.21)).toBe('-33.87,151.21');
  });

  it('handles zero coordinates', () => {
    expect(toAreaHash(0, 0)).toBe('0,0');
  });

  it('rounds exactly at 0.005 boundary', () => {
    // 37.775 rounds to 37.78 (round half-up)
    const hash = toAreaHash(37.775, -122.415);
    const [lat] = hash.split(',');
    expect(parseFloat(lat)).toBe(37.78);
  });

  it('produces a cache-key-safe string with no spaces', () => {
    const hash = toAreaHash(51.5074, -0.1278);
    expect(hash).not.toContain(' ');
    expect(hash).toMatch(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/);
  });
});
