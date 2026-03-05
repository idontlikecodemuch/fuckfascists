import type { Entity } from '../models';
import { normalize } from './normalize';

/**
 * Checks the canonical entity list for an exact alias or canonical-name match.
 * Both the input and stored names are normalized before comparison.
 * An exact match yields HIGH confidence by default (or the level mapped from matchScore if set).
 */
export function findByAlias(
  normalizedInput: string,
  entities: Entity[]
): Entity | null {
  for (const entity of entities) {
    if (normalize(entity.canonicalName) === normalizedInput) return entity;

    for (const alias of entity.aliases) {
      if (normalize(alias) === normalizedInput) return entity;
    }
  }
  return null;
}
