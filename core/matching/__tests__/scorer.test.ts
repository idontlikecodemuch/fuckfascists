import { scoreAll, pickBestMatch } from '../scorer';
import type { OpenSecretsOrg } from '../types';

const walmart: OpenSecretsOrg = { orgid: 'D000000074', orgname: 'Walmart Inc' };
const walgreens: OpenSecretsOrg = { orgid: 'D000000123', orgname: 'Walgreens Boots Alliance' };
const unrelated: OpenSecretsOrg = { orgid: 'D000000999', orgname: 'XYZ Holdings Corp' };

describe('scoreAll', () => {
  it('returns candidates sorted by score descending', () => {
    const results = scoreAll('walmart', [unrelated, walgreens, walmart]);
    expect(results[0].org).toBe(walmart);
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('returns empty array for no candidates', () => {
    expect(scoreAll('walmart', [])).toEqual([]);
  });

  it('assigns score 1 for exact normalized match', () => {
    const exact: OpenSecretsOrg = { orgid: 'X', orgname: 'walmart' };
    const [top] = scoreAll('walmart', [exact]);
    expect(top.score).toBe(1.0);
  });
});

describe('pickBestMatch', () => {
  it('returns HIGH confidence for a strong match', () => {
    const result = pickBestMatch('walmart', [walmart, walgreens, unrelated]);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBe('HIGH');
    expect(result!.org).toBe(walmart);
  });

  it('returns null when best score is below MEDIUM threshold', () => {
    // "abc" vs completely unrelated names → no match
    expect(pickBestMatch('abc', [unrelated])).toBeNull();
  });

  it('returns null for empty candidates', () => {
    expect(pickBestMatch('walmart', [])).toBeNull();
  });

  it('returns MEDIUM confidence for a partial match above medium threshold', () => {
    // "walgreens" vs "walgreens boots alliance" — should score MEDIUM or HIGH
    const result = pickBestMatch('walgreens', [walgreens, unrelated]);
    expect(result).not.toBeNull();
    expect(['HIGH', 'MEDIUM']).toContain(result!.confidence);
  });
});
