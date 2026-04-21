import type { Entity } from '../models';

/**
 * Hosts that small businesses commonly list as their "website" in MapKit even
 * though the host is a third-party profile, listing, or shortlink page — not
 * the business's own site. Matching on these hosts has produced critical false
 * positives (e.g. "Discount Locksmith" → Alphabet via google.com Business
 * Profile, "The Festival Center" → Meta via facebook.com).
 *
 * When the POI host is on this list, the pipeline only trusts the match if the
 * POI name itself also aliases to the same entity (i.e. the user is tapping on
 * an actual Meta/Alphabet office whose POI name is "Meta" / "Google").
 *
 * google.com, maps.google.com, g.page, g.co, goo.gl are all forms of Google
 * Business Profile / Maps share links routinely returned by MKLocalSearch for
 * unrelated local businesses. yelp / foursquare / tripadvisor / nextdoor are
 * review-aggregator profile pages, not first-party sites.
 */
const THIRD_PARTY_PROFILE_DOMAINS = [
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'google.com',
  'maps.google.com',
  'business.google.com',
  'sites.google.com',
  'g.page',
  'g.co',
  'goo.gl',
  'yelp.com',
  'yelp.to',
  'foursquare.com',
  'tripadvisor.com',
  'nextdoor.com',
  'fb.com',
  'fb.me',
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
