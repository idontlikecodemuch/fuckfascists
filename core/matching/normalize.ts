/**
 * Canonical name normalization for entity matching.
 * Applied to both input queries and entity names before any comparison.
 *
 * Rules:
 *  - Lowercase everything
 *  - Strip possessives/quotes (McDonald's → mcdonalds, not mcdonald s)
 *  - Remove joiners without spacing (AT&T → att, Chick-fil-A → chickfila)
 *  - Replace remaining non-alphanumeric with a space
 *  - Collapse runs of whitespace and trim
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[''`]/g, '')         // possessives: McDonald's → mcdonalds
    .replace(/[&\-]/g, '')         // joiners: AT&T → att, 7-Eleven → 7eleven
    .replace(/[^a-z0-9\s]/g, ' ') // everything else → space
    .replace(/\s+/g, ' ')
    .trim();
}
