/**
 * FEC `/committees/?q=` query builder.
 *
 * Mirrors FEC's server-side `parse_fulltext` (openFEC/webservices/utils.py):
 * NFKD-decompose, drop non-ASCII, uppercase, split on `\W+`. Additionally
 * pops end-of-string legal suffixes (INC, LLC, CORP, …) — which FEC itself
 * doesn't do, but we do so that queries built from aliases like
 * `"Apple Inc"` don't over-constrain the tsquery to `APPLE:* & INC:*`
 * (which misses committees named `"APPLE POLITICAL ACTION COMMITTEE"`).
 * Downstream Jaro-Winkler scoring still reranks the FEC response, so the
 * broader recall doesn't hurt precision.
 *
 * Why this can't be `normalize()`:
 *  - `normalize()` collapses `&` / `-` WITHOUT a space (AT&T → att) so
 *    alias matching sees `att` on both sides symmetrically.
 *  - FEC's `parse_fulltext` treats `&` / `-` as `\W` → splits. So
 *    `AT&T MOBILITY INC PAC` stores tsvector tokens [AT, T, MOBILITY, INC, PAC],
 *    and `q=att` produces tsquery `ATT:*` — no match. We need `q="AT T"`
 *    → `AT:* & T:*` to round-trip.
 *
 * Used ONLY when constructing FEC `q=` values. POI taps never call this
 * (they skip the FEC API entirely). Alias matching never calls this.
 */

// Conservative — only words that are unambiguously a legal suffix when at
// the END of an entity name. "Union", "Federal", "Bank", "Credit", "Store"
// are deliberately NOT in this set: "Apple Federal Credit Union" must not
// collapse to "apple".
const LEGAL_SUFFIXES = new Set([
  'INC',
  'INCORPORATED',
  'CORP',
  'CORPORATION',
  'CO',
  'COMPANY',
  'LLC',
  'LLP',
  'LP',
  'LTD',
  'GROUP',
  'HOLDINGS',
  'INTERNATIONAL',
  'AG',
  'SA',
  'PLC',
  'NA',
  'MUTUAL',
]);

/**
 * Build a FEC-API-ready `q=` value from a raw entity / brand / POI name.
 * Returns a space-joined uppercase token string. Callers pass this
 * directly as the `q=` query parameter.
 *
 * Examples:
 *  - `"AT&T"` → `"AT T"`         (ampersand → separator; round-trips to FEC's stored tokens)
 *  - `"Apple Inc"` → `"APPLE"`    (end-of-string `INC` popped; broadens recall)
 *  - `"Apple Federal Credit Union"` → `"APPLE FEDERAL CREDIT UNION"` (no end-of-string suffix; unchanged)
 *  - `"Procter & Gamble"` → `"PROCTER GAMBLE"`
 *  - `"Pâtisserie Valerie"` → `"PATISSERIE VALERIE"` (NFKD fold)
 */
export function normalizeForFecQuery(input: string): string {
  const ascii = String(input ?? '')
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toUpperCase();
  const tokens = ascii.split(/[^A-Z0-9]+/).filter(Boolean);
  while (tokens.length > 1 && LEGAL_SUFFIXES.has(tokens[tokens.length - 1])) {
    tokens.pop();
  }
  return tokens.join(' ');
}
