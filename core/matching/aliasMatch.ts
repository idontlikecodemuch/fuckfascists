import type { Entity } from '../models';
import { normalize } from './normalize';

export interface AliasMatchResult {
  entity: Entity;
  /** The original (un-normalized) alias or canonicalName that matched. */
  matchedAlias: string;
}

/**
 * Minimum number of tokens (words) required in a normalized alias for it to
 * be eligible for prefix matching. Single-word aliases like "Apple",
 * "American", or "Delta" are too ambiguous — they match unrelated businesses
 * ("Apple Federal Credit Union", "American Medical Association"). Multi-word
 * aliases like "Apple Store" or "American Airlines" are specific enough to
 * safely prefix-match location suffixes ("Apple Store Georgetown").
 *
 * Only affects prefix matching (Pass 2). Exact matching (Pass 1) is
 * unaffected — "Apple" still exact-matches the input "apple".
 *
 * On iOS, the enriched MapKit bridge provides domain-based matching
 * (confidence 1.0) before alias matching — handling cases like
 * "Apple Georgetown" definitively. On Android, these fall through
 * to fuzzy FEC search.
 */
const MIN_PREFIX_ALIAS_TOKENS = 2;

/**
 * Maximum number of words allowed in the suffix (text after the matched alias).
 * Prevents multi-word aliases from matching long unrelated organization names.
 * "Apple Store Georgetown" → suffix "georgetown" (1 word) ✅
 * "American Airlines Cargo International Services" → suffix (3 words) ❌
 */
const MAX_PREFIX_SUFFIX_TOKENS = 2;

/** Count the words in the suffix (text after the alias + space separator). */
function suffixTokenCount(normalizedInput: string, normAlias: string): number {
  const suffix = normalizedInput.slice(normAlias.length + 1);
  return suffix.split(' ').filter(Boolean).length;
}

/** Whether a normalized alias is eligible for prefix matching. */
function isPrefixEligible(normAlias: string): boolean {
  const tokenCount = normAlias.split(' ').filter(Boolean).length;
  return tokenCount >= MIN_PREFIX_ALIAS_TOKENS;
}

/**
 * Checks the canonical entity list for an exact alias or canonical-name match.
 * Both the input and stored names are normalized before comparison.
 *
 * Falls back to guarded prefix matching when exact match fails: if the
 * normalized input starts with a multi-word alias followed by a space
 * (e.g. "apple store georgetown" starts with "apple store "), the entity
 * matches. Single-word aliases are not eligible for prefix matching —
 * they produce false positives with unrelated businesses that happen to
 * share a common first word.
 *
 * Returns the matched entity together with the specific alias string that
 * triggered the match, so callers can thread the user-recognizable name
 * through to the UI.
 */
export function findByAlias(
  normalizedInput: string,
  entities: Entity[]
): AliasMatchResult | null {
  // Pass 1: exact match (fast path)
  for (const entity of entities) {
    if (normalize(entity.canonicalName) === normalizedInput) {
      return { entity, matchedAlias: entity.canonicalName };
    }

    for (const alias of entity.aliases) {
      if (normalize(alias) === normalizedInput) {
        return { entity, matchedAlias: alias };
      }
    }
  }

  // Pass 2: prefix match — input starts with "alias " (alias + space).
  // Guards: alias must have ≥ MIN_PREFIX_ALIAS_TOKENS words (no single-word
  // prefixes) and the suffix must be ≤ MAX_PREFIX_SUFFIX_TOKENS words.
  for (const entity of entities) {
    const normCanonical = normalize(entity.canonicalName);
    if (isPrefixEligible(normCanonical) &&
        normalizedInput.length > normCanonical.length &&
        normalizedInput.startsWith(normCanonical + ' ') &&
        suffixTokenCount(normalizedInput, normCanonical) <= MAX_PREFIX_SUFFIX_TOKENS) {
      return { entity, matchedAlias: entity.canonicalName };
    }

    for (const alias of entity.aliases) {
      const normAlias = normalize(alias);
      if (isPrefixEligible(normAlias) &&
          normalizedInput.length > normAlias.length &&
          normalizedInput.startsWith(normAlias + ' ') &&
          suffixTokenCount(normalizedInput, normAlias) <= MAX_PREFIX_SUFFIX_TOKENS) {
        return { entity, matchedAlias: alias };
      }
    }
  }

  return null;
}
