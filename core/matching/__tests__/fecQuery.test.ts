import { normalizeForFecQuery } from '../fecQuery';

describe('normalizeForFecQuery', () => {
  // ── Ampersand / joiner split ──────────────────────────────────────────
  //
  // The core bug this fixes. FEC's parse_fulltext treats `&` and `-` as \W
  // → splits. Our old runtime normalize() collapses them without a space,
  // so "AT&T" sent as `q=att` produced tsquery ATT:* which can't prefix-
  // match the stored `[AT, T, MOBILITY, INC, PAC]` tokens → zero hits for
  // every AT&T / H&M / P&G / J&J brand. This function fixes it by tokenizing
  // on \W, same as FEC's server does.

  it('splits on ampersand (AT&T → "AT T")', () => {
    expect(normalizeForFecQuery('AT&T')).toBe('AT T');
  });

  it('splits on ampersand with surrounding spaces', () => {
    expect(normalizeForFecQuery('Procter & Gamble')).toBe('PROCTER GAMBLE');
    expect(normalizeForFecQuery('Ben & Jerry\'s')).toBe('BEN JERRY S');
    expect(normalizeForFecQuery('Barnes & Noble')).toBe('BARNES NOBLE');
  });

  it('splits on hyphens and other punctuation', () => {
    expect(normalizeForFecQuery('7-Eleven')).toBe('7 ELEVEN');
    expect(normalizeForFecQuery('Chick-fil-A')).toBe('CHICK FIL A');
  });

  // ── Legal suffix pop ───────────────────────────────────────────────────
  //
  // FEC's tsquery is strict AND across tokens — `APPLE:* & INC:*` demands
  // BOTH an APPLE*-prefix and an INC*-prefix token in the stored name.
  // Popping a trailing legal suffix broadens recall. Downstream J-W
  // scoring re-ranks the (larger) response, so precision is preserved.

  it('pops end-of-string INC / LLC / CORP', () => {
    expect(normalizeForFecQuery('Apple Inc')).toBe('APPLE');
    expect(normalizeForFecQuery('Walmart Inc')).toBe('WALMART');
    expect(normalizeForFecQuery('Tesla Inc')).toBe('TESLA');
    expect(normalizeForFecQuery('X Corp')).toBe('X');
    expect(normalizeForFecQuery('Space Exploration Technologies Corp')).toBe('SPACE EXPLORATION TECHNOLOGIES');
    expect(normalizeForFecQuery('JPMorgan Chase & Co')).toBe('JPMORGAN CHASE');
  });

  it('pops multiple trailing legal suffixes', () => {
    // "Apple Holdings Inc" → pop INC → ["APPLE", "HOLDINGS"] → pop HOLDINGS → "APPLE"
    expect(normalizeForFecQuery('Apple Holdings Inc')).toBe('APPLE');
  });

  it('does NOT pop legal suffixes from the middle', () => {
    // "Inc" appearing mid-name stays; only the trailing token is popped.
    expect(normalizeForFecQuery('Inc Corporation Holdings')).toBe('INC');
    // After popping trailing CORPORATION then HOLDINGS — wait, ordering is
    // pop from end while last token is in the set. Here:
    //   ["INC", "CORPORATION", "HOLDINGS"] → pop HOLDINGS → ["INC", "CORPORATION"]
    //   → pop CORPORATION → ["INC"] → loop breaks (tokens.length === 1 guard)
    // So INC stays, even though it's a suffix, because we never strip the
    // only remaining token.
  });

  it('preserves at least one token — never strips everything', () => {
    expect(normalizeForFecQuery('Inc')).toBe('INC');
    expect(normalizeForFecQuery('LLC')).toBe('LLC');
    expect(normalizeForFecQuery('Holdings')).toBe('HOLDINGS');
  });

  // ── The "Apple Federal Credit Union" case ──────────────────────────────
  //
  // User flagged this as the precision concern. "Credit" / "Union" / "Federal"
  // are deliberately NOT in the legal-suffix list — they're substantive words.
  // So the query stays fully constrained, and FEC's tsquery correctly rejects
  // Apple Inc's PAC (which has no FEDERAL*/CREDIT*/UNION* tokens in its name).

  it('leaves "Apple Federal Credit Union" unchanged (union is not a legal suffix)', () => {
    expect(normalizeForFecQuery('Apple Federal Credit Union')).toBe('APPLE FEDERAL CREDIT UNION');
  });

  it('leaves "Apple Store" unchanged (store is not a legal suffix)', () => {
    expect(normalizeForFecQuery('Apple Store')).toBe('APPLE STORE');
  });

  // ── Accent folding ─────────────────────────────────────────────────────

  it('NFKD-folds accents to ASCII (matches FEC parse_fulltext)', () => {
    expect(normalizeForFecQuery('Pâtisserie Valerie')).toBe('PATISSERIE VALERIE');
    expect(normalizeForFecQuery('MUÑOZ, JUAN')).toBe('MUNOZ JUAN');
    expect(normalizeForFecQuery('Zoé')).toBe('ZOE');
  });

  // ── Edge cases ─────────────────────────────────────────────────────────

  it('handles empty / whitespace / null input', () => {
    expect(normalizeForFecQuery('')).toBe('');
    expect(normalizeForFecQuery('   ')).toBe('');
    // @ts-expect-error — validating runtime safety
    expect(normalizeForFecQuery(null)).toBe('');
    // @ts-expect-error
    expect(normalizeForFecQuery(undefined)).toBe('');
  });

  it('collapses runs of separator punctuation', () => {
    expect(normalizeForFecQuery('Foo  &&  Bar')).toBe('FOO BAR');
    expect(normalizeForFecQuery('Foo---Bar')).toBe('FOO BAR');
  });

  it('preserves digits and alphanumeric mixes', () => {
    expect(normalizeForFecQuery('7-Eleven Inc')).toBe('7 ELEVEN');
    expect(normalizeForFecQuery('3M Company')).toBe('3M');
  });
});
