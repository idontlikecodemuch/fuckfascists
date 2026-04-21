import type { PoliticalPerson } from '../../../core/models';
import type { ScanResult } from '../types';

/**
 * Banner variant — lightweight dismissible bar when we can't show a full card.
 *   no_match       — search text didn't match any FEC filing
 *   lookup_failed  — FEC API call failed
 *   no_pac         — entity matched but has no corporate PAC on file
 *   dissolved      — entity's PAC is dissolved with all-zero donation data
 */
export type BannerVariant = 'no_match' | 'lookup_failed' | 'no_pac' | 'dissolved';

/**
 * Decides whether a ScanResult should render as a full card or a banner.
 *
 * Unified signal gate: the card shows whenever we have any live donation
 * signal — from the entity's PAC OR from any linked donor/executive
 * (associatedPeople). The source doesn't matter; the question is just
 * whether there's something to show. If neither source has data, we fall
 * through to a banner that explains the most accurate reason.
 *
 * This function is the single source of truth for card/banner routing
 * across the app business card AND the extension popup — Principle #8
 * cross-surface data parity. Pure TS so it's importable from the
 * extension service worker / popup without pulling in React.
 *
 * CARD: entity has donation data (PAC or people), OR matched by committee ID
 *       only, OR known PAC awaiting fetch.
 * BANNER: no match, lookup failed, confirmed no PAC + no linked people,
 *         dissolved PAC + no linked people.
 */
export function resolveCardMode(
  result: ScanResult,
  associatedPeople: PoliticalPerson[] = [],
): 'card' | { banner: BannerVariant } {
  const entity = result.entity;

  // No entity at all — either no match or matched by committee ID fallback
  if (!entity) {
    return result.fecCommitteeId ? 'card' : { banner: 'no_match' };
  }

  // Signal check — any live donation data from any source.
  // Either a PAC with non-zero activity or at least one linked person with
  // a hydrated donationSummary counts as enough to show the card.
  const pacActive = result.donationSummary != null && (
    result.donationSummary.recentRepubs !== 0 ||
    result.donationSummary.recentDems   !== 0 ||
    result.donationSummary.totalRepubs  !== 0 ||
    result.donationSummary.totalDems    !== 0
  );
  const peopleActive = associatedPeople.some((p) => {
    const ds = p.donationSummary;
    return ds != null && (ds.totalR !== 0 || ds.totalD !== 0 || (ds.totalO ?? 0) !== 0);
  });
  if (pacActive || peopleActive) return 'card';

  // No signal anywhere — pick the most accurate banner reason.
  if (result.donationSummary)         return { banner: 'dissolved' };  // PAC existed, all zero
  if (entity.fecCommitteeId === null) return { banner: 'no_pac' };     // confirmed no PAC
  if (entity.fecCommitteeId)          return 'card';                    // PAC known, data fetching
  return { banner: 'no_pac' };                                           // unverified, no PAC info
}
