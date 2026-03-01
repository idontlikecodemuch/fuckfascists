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
    // 0.005 degree difference ≈ 500m — same grid cell
    const a = toAreaHash(37.7749, -122.4194);
    const b = toAreaHash(37.7752, -122.4197);
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
