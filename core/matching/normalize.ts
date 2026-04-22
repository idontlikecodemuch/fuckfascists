/**
 * Canonical name normalization for entity matching.
 * Applied symmetrically to input queries and entity names before any
 * comparison — aliasMatch, J-W scoring, cache keys.
 *
 * Rules:
 *  - NFKD-decompose and drop non-ASCII (Pâtisserie → Patisserie, Zoé → Zoe)
 *  - Lowercase everything
 *  - Strip possessives/quotes (McDonald's → mcdonalds, not mcdonald s)
 *  - Remove joiners without spacing (AT&T → att, Chick-fil-A → chickfila)
 *  - Replace remaining non-alphanumeric with a space
 *  - Collapse runs of whitespace and trim
 *
 * NOT intended for constructing FEC API `q=` values — that path needs
 * FEC-flavored tokenization (ampersand as separator, end-of-string legal
 * suffix pop). See `normalizeForFecQuery` in ./fecQuery.ts.
 */
export function normalize(input: string): string {
  return input
    .normalize('NFKD')            // decompose accents: Pâtisserie → Pa + ◌̂ + tisserie
    .replace(/[^\x00-\x7F]/g, '') // drop non-ASCII (combining marks, Ø, ß, …)
    .toLowerCase()
    .replace(/[''`]/g, '')        // possessives: McDonald's → mcdonalds
    .replace(/[&\-]/g, '')        // joiners: AT&T → att, 7-Eleven → 7eleven
    .replace(/[^a-z0-9\s]/g, ' ') // everything else → space
    .replace(/\s+/g, ' ')
    .trim();
}
