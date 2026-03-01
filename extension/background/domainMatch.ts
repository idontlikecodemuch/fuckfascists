import type { Entity } from '../../core/models';

/**
 * Finds the first entity whose `domains` list contains the given hostname.
 *
 * This is the primary matching mechanism for the extension — exact domain
 * lookup, not fuzzy name matching. Subdomain stripping: "www.amazon.com" and
 * "smile.amazon.com" both appear explicitly in entity.domains so no stripping
 * is needed in the general case. We also try stripping "www." as a convenience
 * fallback in case the entity list only has the apex domain.
 */
export function findByDomain(hostname: string, entities: Entity[]): Entity | null {
  const lower = hostname.toLowerCase();
  const noWww = lower.startsWith('www.') ? lower.slice(4) : lower;

  for (const entity of entities) {
    for (const domain of entity.domains) {
      if (domain === lower || domain === noWww) return entity;
    }
  }
  return null;
}
