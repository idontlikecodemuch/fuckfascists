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
 * An exact match yields HIGH confidence by default (or the level mapped from matchScore if set).
 *
 * Returns the matched entity together with the specific alias string that triggered
 * the match, so callers can thread the user-recognizable name through to the UI.
 */
export function findByAlias(
  normalizedInput: string,
  entities: Entity[]
): AliasMatchResult | null {
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
  return null;
}
