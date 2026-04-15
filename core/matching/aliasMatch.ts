import type { Entity } from '../models';
import { normalize } from './normalize';

export interface AliasMatchResult {
  entity: Entity;
  /** The original (un-normalized) alias or canonicalName that matched. */
  matchedAlias: string;
}

/**
 * Checks the canonical entity list for an exact alias or canonical-name match.
 * Both the input and stored names are normalized before comparison.
 *
 * Falls back to prefix matching when exact match fails: if the normalized input
 * starts with a normalized alias followed by a space (e.g. "apple georgetown"
 * starts with "apple "), the entity matches. This covers retail store naming
 * patterns like "Apple Georgetown", "Walmart Neighborhood Market", etc.
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
  // Only triggers when the alias is shorter than the input (avoids matching
  // "Apple" against "App"). The trailing space ensures word-boundary alignment.
  for (const entity of entities) {
    const normCanonical = normalize(entity.canonicalName);
    if (normalizedInput.length > normCanonical.length &&
        normalizedInput.startsWith(normCanonical + ' ')) {
      return { entity, matchedAlias: entity.canonicalName };
    }

    for (const alias of entity.aliases) {
      const normAlias = normalize(alias);
      if (normalizedInput.length > normAlias.length &&
          normalizedInput.startsWith(normAlias + ' ')) {
        return { entity, matchedAlias: alias };
      }
    }
  }

  return null;
}
