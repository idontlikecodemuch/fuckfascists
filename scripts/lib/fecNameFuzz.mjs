/**
 * FEC contributor-name fuzz — verbatim port of openFEC's `parse_fulltext`.
 *
 * Upstream source (BSD-3, fecgov/openFEC):
 *   https://github.com/fecgov/openFEC/blob/develop/webservices/utils.py
 *
 *   def parse_fulltext(text):
 *       text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
 *       return " & ".join([part + ":*" for part in re.sub(r"\W", " ", text).split()])
 *
 * FEC's web UI resolves `contributor_name=BEZOS, JEFF` by feeding the query
 * through `parse_fulltext` and evaluating the resulting Postgres tsquery
 * against a tsvector column built from the same text pipeline. Semantics:
 *
 *   1. NFKD decompose + strip non-ASCII chars (accent folding)
 *   2. Split on non-word characters (equivalent to Python `\W+`)
 *   3. Uppercase tokens
 *   4. A query token matches a field token iff the field token has the
 *      query token as a PREFIX (Postgres `:*` lexeme prefix operator)
 *   5. All query tokens must match (AND — `&` in tsquery)
 *
 * Thus query `BEZOS, JEFF` → tokens {BEZOS, JEFF} matches field
 * `BEZOS, JEFFREY PRESTON` (BEZOS* ← BEZOS, JEFF* ← JEFFREY) but not
 * `BEZOS, JOHN` (no field token starts with JEFF).
 *
 * We replicate this in JS so our bulk hydrator produces the same coverage
 * FEC's web UI would show. The functions here are the single source of
 * truth for FEC-flavored name matching in this codebase — the hydrator
 * uses `matchesQueryAgainst`, not a bespoke matcher.
 */

// FEC's `\W` on uppercased-ASCII text is equivalent to "anything that isn't
// [A-Z0-9_]". Python's `\W` keeps `_` as a word char; so do we. Splitting
// on this class and filtering empties mirrors Python's `str.split()` on the
// `re.sub(\W, " ", ...)` output.
const NON_WORD_SPLIT = /[^A-Z0-9_]+/;

/**
 * Normalize + tokenize FEC-style. Returns uppercase token array.
 *
 * Mirrors:
 *   unicodedata.normalize("NFKD", text)   # decompose accents
 *     .encode("ascii", "ignore")          # drop anything non-ASCII
 *     .decode("ascii")
 *   re.sub(r"\W", " ", text).split()      # split on non-word runs
 */
export function tokenize(text) {
  if (text == null) return [];
  const ascii = String(text)
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toUpperCase();
  const tokens = ascii.split(NON_WORD_SPLIT);
  const out = [];
  for (const token of tokens) {
    if (token.length > 0) out.push(token);
  }
  return out;
}

/**
 * Build a reusable query from a search name. Returns the tokenized form.
 * Callers typically build this once per person and reuse it across every
 * candidate field value.
 */
export function buildQuery(queryText) {
  return tokenize(queryText);
}

/**
 * True when every query token prefix-matches at least one field token (AND).
 *
 * Prefix direction matches Postgres `:*` — the STORED (field) token must
 * START WITH the query token. `JEFF:*` matches `JEFFREY` but not `JEF`.
 */
export function matchesQueryAgainst(fieldTokens, queryTokens) {
  if (!queryTokens || queryTokens.length === 0) return false;
  if (!fieldTokens || fieldTokens.length === 0) return false;
  for (const q of queryTokens) {
    let found = false;
    for (const f of fieldTokens) {
      if (f.startsWith(q)) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

/**
 * Convenience wrapper: tokenize `fieldText` then delegate.
 * Hot-path callers should prefer `matchesQueryAgainst` with pre-tokenized
 * field tokens to avoid re-tokenizing per candidate.
 */
export function matchesQuery(fieldText, queryTokens) {
  return matchesQueryAgainst(tokenize(fieldText), queryTokens);
}
