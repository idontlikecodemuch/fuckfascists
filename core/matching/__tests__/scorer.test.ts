import { scoreAll, pickBestMatch, candidateTokensAppearInInput } from '../scorer';
import type { FECCommittee } from '../types';

const walmart: FECCommittee = { orgid: 'D000000074', orgname: 'Walmart Inc' };
const walgreens: FECCommittee = { orgid: 'D000000123', orgname: 'Walgreens Boots Alliance' };
const unrelated: FECCommittee = { orgid: 'D000000999', orgname: 'XYZ Holdings Corp' };
const americanAirlines: FECCommittee = {
  orgid: 'C00107300',
  orgname: 'American Airlines Inc. Political Action Committee (AAPAC)',
};

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
    const exact: FECCommittee = { orgid: 'X', orgname: 'walmart' };
    const [top] = scoreAll('walmart', [exact]);
    expect(top.score).toBe(1.0);
  });
});

describe('pickBestMatch', () => {
  it('returns high confidence score for a strong match', () => {
    const result = pickBestMatch('walmart', [walmart, walgreens, unrelated]);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBeGreaterThanOrEqual(0.85); // CONFIDENCE_THRESHOLD_HIGH
    expect(result!.confidence).toBeLessThanOrEqual(1.0);
    expect(result!.org).toBe(walmart);
  });

  it('returns null when best score is below MEDIUM threshold', () => {
    // "abc" vs completely unrelated names → no match
    expect(pickBestMatch('abc', [unrelated])).toBeNull();
  });

  it('returns null for empty candidates', () => {
    expect(pickBestMatch('walmart', [])).toBeNull();
  });

  it('returns a confidence score >= medium threshold for a partial match', () => {
    // Input must carry the full candidate content signal now that the token
    // guard is in place — "walgreens" alone is caught by the curated alias
    // list in real flows; here we exercise the scorer with an input that has
    // all of the candidate's discriminating tokens.
    const result = pickBestMatch('walgreens boots alliance', [walgreens, unrelated]);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBeGreaterThanOrEqual(0.60); // CONFIDENCE_THRESHOLD_MEDIUM
    expect(result!.confidence).toBeLessThanOrEqual(1.0);
  });

  // TestFlight regression #87 — a nonprofit whose name only shares a generic
  // "American " prefix with the airline was being attributed to the American
  // Airlines PAC because Jaro-Winkler's prefix bonus pushes the similarity to
  // ~0.85. The token-safety guard blocks this: "airlines" is not in the input
  // token set, so the candidate must be rejected regardless of JW score.
  it('rejects a prefix-bonus false positive when discriminating tokens are absent from input', () => {
    const input = 'american association of teachers of german';
    const result = pickBestMatch(input, [americanAirlines]);
    expect(result).toBeNull();
  });

  it('walks past a prefix-bonus false positive to find a token-safe runner-up', () => {
    const legit: FECCommittee = {
      orgid: 'C00000999',
      orgname: 'American Association of Teachers of German PAC',
    };
    const input = 'american association of teachers of german';
    const result = pickBestMatch(input, [americanAirlines, legit]);
    expect(result).not.toBeNull();
    expect(result!.org).toBe(legit);
  });

  it('still accepts a legitimate match when every candidate content token is in the input', () => {
    const result = pickBestMatch('walmart', [walmart]);
    expect(result).not.toBeNull();
    expect(result!.org).toBe(walmart);
  });
});

describe('candidateTokensAppearInInput', () => {
  it('requires every non-stopword candidate token to appear in the input set', () => {
    expect(
      candidateTokensAppearInInput('walmart', 'Walmart Inc'),
    ).toBe(true);
    expect(
      candidateTokensAppearInInput(
        'american association of teachers of german',
        'American Airlines Inc',
      ),
    ).toBe(false);
  });

  it('strips PAC/corporate suffixes before checking', () => {
    // "Walmart Inc Political Action Committee" — after stripping suffixes, only
    // "walmart" remains and it appears in the input.
    expect(
      candidateTokensAppearInInput(
        'walmart',
        'Walmart Inc Political Action Committee',
      ),
    ).toBe(true);
  });

  it('rejects candidates whose every token is a stopword', () => {
    // Purely suffix-noise orgnames carry no discriminating signal and must not
    // match anything on JW score alone.
    expect(
      candidateTokensAppearInInput('some input', 'The Federal PAC Inc'),
    ).toBe(false);
  });

  it('matches short company names with a single discriminating token', () => {
    expect(candidateTokensAppearInInput('apple', 'Apple Inc')).toBe(true);
  });
});
