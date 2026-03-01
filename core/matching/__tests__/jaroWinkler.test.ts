import { jaro, jaroWinkler } from '../jaroWinkler';

describe('jaro', () => {
  it('returns 1 for identical strings', () => {
    expect(jaro('walmart', 'walmart')).toBe(1.0);
    expect(jaro('', '')).toBe(1.0);
  });

  it('returns 0 for empty vs non-empty', () => {
    expect(jaro('', 'abc')).toBe(0.0);
    expect(jaro('abc', '')).toBe(0.0);
  });

  it('scores MARTHA vs MARHTA correctly (known vector)', () => {
    // Wikipedia Jaro example: ≈ 0.9444
    expect(jaro('MARTHA', 'MARHTA')).toBeCloseTo(0.9444, 3);
  });

  it('scores DIXON vs DICKSONX correctly (known vector)', () => {
    // Wikipedia Jaro example: ≈ 0.7667
    expect(jaro('DIXON', 'DICKSONX')).toBeCloseTo(0.7667, 3);
  });

  it('scores completely different strings low', () => {
    expect(jaro('abc', 'xyz')).toBe(0.0);
  });

  it('is symmetric', () => {
    const a = jaro('walmart', 'walmark');
    const b = jaro('walmark', 'walmart');
    expect(a).toBeCloseTo(b, 10);
  });
});

describe('jaroWinkler', () => {
  it('returns 1 for identical strings', () => {
    expect(jaroWinkler('walmart', 'walmart')).toBe(1.0);
  });

  it('scores MARTHA vs MARHTA correctly (known vector)', () => {
    // Wikipedia Jaro-Winkler example: ≈ 0.9611
    expect(jaroWinkler('MARTHA', 'MARHTA')).toBeCloseTo(0.9611, 3);
  });

  it('boosts strings with a common prefix vs jaro alone', () => {
    const s1 = 'walmart';
    const s2 = 'walmark';
    expect(jaroWinkler(s1, s2)).toBeGreaterThan(jaro(s1, s2));
  });

  it('does not boost strings with no common prefix', () => {
    // CRATE vs TRACE share no prefix — JW equals jaro
    const s1 = 'CRATE';
    const s2 = 'TRACE';
    expect(jaroWinkler(s1, s2)).toBeCloseTo(jaro(s1, s2), 10);
  });

  it('is symmetric', () => {
    expect(jaroWinkler('target', 'targt')).toBeCloseTo(
      jaroWinkler('targt', 'target'),
      10
    );
  });
});
