import type { Entity } from '../models';

const THIRD_PARTY_PROFILE_DOMAINS = [
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'youtube.com',
];

/**
 * Normalizes a hostname for domain comparison.
 * Lowercases and strips the "www." prefix.
 */
export function normalizeHost(host: string): string {
  const lower = host.toLowerCase().trim();
  return lower.startsWith('www.') ? lower.slice(4) : lower;
}

/**
 * True when a host commonly points to a third-party profile/page rather than
 * the POI's own first-party website. MapKit frequently returns these for local
 * businesses, so the matching pipeline must not treat them as definitive.
 */
export function isThirdPartyProfileHost(host: string): boolean {
  const normalized = normalizeHost(host);
  return THIRD_PARTY_PROFILE_DOMAINS.some((domain) =>
    normalized === domain || normalized.endsWith('.' + domain)
  );
}

/**
 * Finds the first entity whose `domains` list contains the given hostname.
 * Handles www. prefix stripping and subdomain matching (e.g. "careers.walmart.com"
 * matches entity domain "walmart.com").
 *
 * Returns the matched entity or null. Confidence is always 1.0 when a domain
 * matches — domain matching is definitive.
 *
 * Aligned with extension/background/domainMatch.ts (same algorithm, shared
 * location in core/ for the mobile matching pipeline).
 */
export function findByDomain(
  host: string,
  entities: Entity[],
): Entity | null {
  if (!host) return null;
  const normalized = normalizeHost(host);
  if (!normalized) return null;

  for (const entity of entities) {
    for (const domain of entity.domains) {
      const normDomain = domain.toLowerCase();
      if (normalized === normDomain) return entity;
      if (normalized.endsWith('.' + normDomain)) return entity;
    }
  }

  return null;
}
