import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildQuery,
  matchesQuery,
  matchesQueryAgainst,
  tokenize,
} from '../lib/fecNameFuzz.mjs';

// ── tokenize: matches Python NFKD + ascii-ignore + \W split ─────────────

test('tokenize: canonical FEC "LAST, FIRST" form', () => {
  assert.deepEqual(tokenize('BEZOS, JEFF'), ['BEZOS', 'JEFF']);
});

test('tokenize: multi-token first name + middle initial', () => {
  assert.deepEqual(tokenize('BEZOS, JEFFREY PRESTON'), ['BEZOS', 'JEFFREY', 'PRESTON']);
  assert.deepEqual(tokenize('BEZOS, JEFFREY P'), ['BEZOS', 'JEFFREY', 'P']);
});

test('tokenize: lowercase input is uppercased', () => {
  assert.deepEqual(tokenize('Bezos, Jeff'), ['BEZOS', 'JEFF']);
});

test('tokenize: NFKD-decomposable accents are folded', () => {
  // "Muñoz" → NFKD → "Mun" + combining tilde + "oz" → ascii drop → "Munoz"
  assert.deepEqual(tokenize('MUÑOZ, JUAN'), ['MUNOZ', 'JUAN']);
  assert.deepEqual(tokenize('ZoÉ, ÉLODIE'), ['ZOE', 'ELODIE']);
});

test('tokenize: non-decomposable non-ASCII is silently dropped (matches Python ascii-ignore)', () => {
  // `ß` doesn't NFKD-decompose; Python's `.encode("ascii", "ignore")` drops
  // the byte entirely rather than replacing it with a space, so adjacent
  // chars concatenate. We mirror that: "STRAßE" → "STRAE".
  assert.deepEqual(tokenize('STRAßE, WALTER'), ['STRAE', 'WALTER']);
  // Same story for Ø, Æ, etc.
  assert.deepEqual(tokenize('ØLSEN, KARL'), ['LSEN', 'KARL']);
});

test('tokenize: punctuation, hyphens, apostrophes split like Python \\W', () => {
  assert.deepEqual(tokenize("O'BRIEN-SMITH, MARY"), ['O', 'BRIEN', 'SMITH', 'MARY']);
  assert.deepEqual(tokenize('AT&T'), ['AT', 'T']);
});

test('tokenize: preserves digits and underscores (Python \\W keeps _ as word)', () => {
  assert.deepEqual(tokenize('SMITH_JR, JOHN 3RD'), ['SMITH_JR', 'JOHN', '3RD']);
});

test('tokenize: null / undefined / empty input → empty array', () => {
  assert.deepEqual(tokenize(null), []);
  assert.deepEqual(tokenize(undefined), []);
  assert.deepEqual(tokenize(''), []);
  assert.deepEqual(tokenize('   '), []);
});

// ── matchesQuery: FEC tsquery AND-of-prefix semantics ─────────────────

test('matchesQuery: Bezos canonical case — JEFF* matches JEFFREY', () => {
  // The load-bearing test for this entire effort. FEC's UI matches these;
  // our exact-match hydrator did not, which is how we lost Blue Origin PAC.
  const query = buildQuery('BEZOS, JEFF');
  assert.equal(matchesQuery('BEZOS, JEFFREY PRESTON', query), true);
  assert.equal(matchesQuery('BEZOS, JEFFREY P', query), true);
  assert.equal(matchesQuery('BEZOS, JEFFREY', query), true);
  assert.equal(matchesQuery('BEZOS, JEFF', query), true);
});

test('matchesQuery: different first name — does not match', () => {
  const query = buildQuery('BEZOS, JEFF');
  assert.equal(matchesQuery('BEZOS, JOHN', query), false);
  assert.equal(matchesQuery('BEZOS, JACKIE', query), false);
});

test('matchesQuery: different last name — does not match', () => {
  const query = buildQuery('BEZOS, JEFF');
  assert.equal(matchesQuery('GATES, JEFFREY', query), false);
});

test('matchesQuery: prefix direction — query prefix of field, not the reverse', () => {
  // JEFF* matches JEFFREY but JEFFREY* does NOT match JEFF.
  assert.equal(matchesQuery('BEZOS, JEFFREY', buildQuery('BEZOS, JEFF')), true);
  assert.equal(matchesQuery('BEZOS, JEFF', buildQuery('BEZOS, JEFFREY')), false);
});

test('matchesQuery: accent folding works on both sides', () => {
  assert.equal(matchesQuery('MUÑOZ, JUAN', buildQuery('Munoz, Juan')), true);
  assert.equal(matchesQuery('MUNOZ, JUAN', buildQuery('Muñoz, Juan')), true);
});

test('matchesQuery: punctuation split consistently on both sides', () => {
  // "O'BRIEN" tokenizes to [O, BRIEN] everywhere; a single-token query
  // "OBRIEN" would NOT match because OBRIEN* does not prefix O or BRIEN.
  // This matches FEC's actual behavior — their web UI has the same gap.
  assert.equal(matchesQuery("O'BRIEN, MARY", buildQuery('OBRIEN MARY')), false);
  assert.equal(matchesQuery("O'BRIEN, MARY", buildQuery("O'BRIEN MARY")), true);
});

test('matchesQuery: compound last name — JEFFREY* still matches', () => {
  const query = buildQuery('BEZOS, JEFF');
  assert.equal(matchesQuery('BEZOS-SMITH, JEFFREY', query), true);
});

test('matchesQuery: empty inputs', () => {
  assert.equal(matchesQuery('BEZOS, JEFF', []), false);
  assert.equal(matchesQuery('', buildQuery('BEZOS, JEFF')), false);
  assert.equal(matchesQuery(null, buildQuery('BEZOS, JEFF')), false);
  assert.equal(matchesQuery('BEZOS, JEFF', null), false);
});

// ── matchesQueryAgainst: hot-path variant with pre-tokenized field ─────

test('matchesQueryAgainst: equivalent result to matchesQuery', () => {
  const fieldTokens = tokenize('BEZOS, JEFFREY PRESTON');
  const query = buildQuery('BEZOS, JEFF');
  assert.equal(matchesQueryAgainst(fieldTokens, query), true);
  assert.equal(matchesQueryAgainst(fieldTokens, buildQuery('BEZOS, JOHN')), false);
});
