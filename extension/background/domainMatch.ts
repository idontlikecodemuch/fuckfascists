import type { Entity } from '../../core/models';

/**
 * Finds the first entity whose `domains` list contains the given hostname.
 *
 * This is the primary matching mechanism for the extension — exact domain
 * lookup, not fuzzy name matching. Matching accepts exact curated domains,
 * `www.` variants, and owned subdomains of curated apex domains. The suffix
 * check is dot-boundary guarded so `notamazon.com` cannot match `amazon.com`.
 */
export function findByDomain(hostname: string, entities: Entity[]): Entity | null {
  const lower = normalizeDomain(hostname);
  if (!lower) return null;
  const noWww = stripWww(lower);

  for (const entity of entities) {
    for (const domain of entity.domains) {
      const candidate = normalizeDomain(domain);
      if (!candidate) continue;

      const candidateNoWww = stripWww(candidate);
      if (
        lower === candidate ||
        noWww === candidate ||
        lower === candidateNoWww ||
        noWww === candidateNoWww ||
        noWww.endsWith(`.${candidateNoWww}`)
      ) {
        return entity;
      }
    }
  }
  return null;
}

function normalizeDomain(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, '');
}

function stripWww(value: string): string {
  return value.startsWith('www.') ? value.slice(4) : value;
}
