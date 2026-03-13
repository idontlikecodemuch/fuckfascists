import type { LocalCache, DonationSummary } from '../models';
import type { FECCommittee, MatchResult, MatchingDeps } from './types';
import { normalize } from './normalize';
import { findByAlias } from './aliasMatch';
import { pickBestMatch } from './scorer';
import {
  CONFIDENCE_THRESHOLD_HIGH,
  CONFIDENCE_THRESHOLD_MEDIUM,
  ENTITY_CACHE_TTL_DAYS,
} from '../../config/constants';

/**
 * Maps an entity's optional matchScore to a numeric confidence value (0–1).
 * - undefined (not set) → 1.0: exact alias match with no override = full confidence
 * - score ≥ MEDIUM threshold → score passed through as-is
 * - score < MEDIUM threshold → null (entity should not be flagged)
 */
function scoreToConfidence(matchScore: number | undefined): number | null {
  if (matchScore === undefined) return 1.0;
  if (matchScore >= CONFIDENCE_THRESHOLD_MEDIUM) return matchScore;
  return null;
}

function buildCacheKey(normalizedName: string, areaHash: string): string {
  return normalize(normalizedName + areaHash);
}

function isCacheExpired(fetchedAt: number): boolean {
  const ttlMs = ENTITY_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - fetchedAt > ttlMs;
}

/** True when an entity's bundled donationSummary is still within the cache TTL window. */
function isBundledSummaryFresh(lastVerifiedDate: string): boolean {
  return !isCacheExpired(new Date(lastVerifiedDate).getTime());
}

/**
 * Treat clearly broken bundled summaries as stale so the app re-fetches live data.
 *
 * This guards against pipeline runs that wrote activeCycles/recentCycle metadata
 * but left partisan totals zeroed, which causes the UI to render "$0" cards
 * even though the committee has recorded activity.
 */
function shouldUseBundledSummary(
  donationSummary: DonationSummary | undefined,
  lastVerifiedDate: string
): donationSummary is DonationSummary {
  if (!donationSummary) return false;
  if (!isBundledSummaryFresh(lastVerifiedDate)) return false;

  const rawItems = Array.isArray(donationSummary.raw) ? donationSummary.raw : [];
  // Suspicious = committee has active cycles and a recent cycle but zero partisan totals
  // AND zero raw items — meaning the pipeline ran but attributed nothing at all.
  // Entities with non-empty raw[] (e.g. pre-attribution-fix runs) are not suspicious —
  // they fetched real data; the attribution just landed in raw instead of partisan buckets.
  const looksSuspiciouslyZeroed =
    donationSummary.activeCycles.length > 0 &&
    donationSummary.recentCycle > 0 &&
    donationSummary.recentRepubs === 0 &&
    donationSummary.recentDems === 0 &&
    donationSummary.totalRepubs === 0 &&
    donationSummary.totalDems === 0 &&
    rawItems.length === 0;

  return !looksSuspiciouslyZeroed;
}

function shouldUseCachedSummary(cached: LocalCache): boolean {
  if (isCacheExpired(cached.fetchedAt)) return false;

  const donationSummary = cached.donationSummary;
  if (!donationSummary) return true;

  const rawItems = Array.isArray(donationSummary.raw) ? donationSummary.raw : [];
  const looksSuspiciouslyZeroed =
    donationSummary.activeCycles.length > 0 &&
    donationSummary.recentCycle > 0 &&
    donationSummary.recentRepubs === 0 &&
    donationSummary.recentDems === 0 &&
    donationSummary.totalRepubs === 0 &&
    donationSummary.totalDems === 0 &&
    rawItems.length === 0;

  return !looksSuspiciouslyZeroed;
}

/**
 * Full entity matching pipeline. Steps:
 *  1. Normalize input
 *  2. Check LocalCache — return immediately on a valid hit
 *  3. Exact alias match against canonical entity list → HIGH confidence
 *  4. FEC searchCommittees → Jaro-Winkler scoring → pick best match
 *  5. Cache result and return MatchSuccess | MatchFailure
 *
 * @param rawInput  Raw business or platform name from the user / extension
 * @param deps      Injected API + cache adapters (swap real impls for mocks in tests)
 * @param areaHash  Optional rough-area token used in cache key (never coordinates)
 */
export async function matchEntity(
  rawInput: string,
  deps: MatchingDeps,
  areaHash = ''
): Promise<MatchResult> {
  const normalizedInput = normalize(rawInput);
  const cacheKey = buildCacheKey(normalizedInput, areaHash);

  // Step 1: Cache check
  const cached = await deps.getCache(cacheKey);
  if (cached && shouldUseCachedSummary(cached)) {
    const entity =
      deps.entities.find((e) => e.fecCommitteeId === cached.fecCommitteeId) ??
      null;
    return {
      matched: true,
      lookupStatus: 'matched',
      entity,
      committeeName: entity?.canonicalName ?? cached.donationSummary?.committeeName ?? null,
      confidence: cached.confidence,
      fecCommitteeId: cached.fecCommitteeId,
      donationSummary: cached.donationSummary,
      fromCache: true,
    };
  }

  // Step 2: Exact alias match
  const aliasMatch = findByAlias(normalizedInput, deps.entities);
  if (aliasMatch) {
    // Fix A: explicit check — empty string ("unverified") must not fall through to resolveOrgId
    let orgId: string | null;
    try {
      orgId =
        (aliasMatch.fecCommitteeId != null && aliasMatch.fecCommitteeId !== '')
          ? aliasMatch.fecCommitteeId
          : await resolveOrgId(aliasMatch.canonicalName, deps);
    } catch {
      return { matched: false, lookupStatus: 'lookup_unavailable', normalizedInput };
    }

    if (!orgId) return { matched: false, lookupStatus: 'no_match', normalizedInput };

    const confidence = 1.0; // alias matches are always exact — full confidence

    // Use bundled donationSummary when present and fresh — skips live API call.
    let donationSummary: DonationSummary | null = null;
    if (shouldUseBundledSummary(aliasMatch.donationSummary, aliasMatch.lastVerifiedDate)) {
      donationSummary = aliasMatch.donationSummary;
    } else {
      try {
        donationSummary = await deps.fetchOrgSummary(orgId);
      } catch {
        // API unavailable — match still succeeds; card shows without donation data
      }
    }

    if (donationSummary) {
      await deps.setCache({
        key: cacheKey,
        fecCommitteeId: orgId,
        donationSummary,
        confidence,
        fetchedAt: Date.now(),
      });
    }

    return {
      matched: true,
      lookupStatus: 'matched',
      entity: aliasMatch,
      committeeName: aliasMatch.canonicalName,
      confidence,
      fecCommitteeId: orgId,
      donationSummary,
      fromCache: false,
    };
  }

  // Step 3: Fuzzy FEC committee search
  // fetchOrgs can 403 in anonymous mode — treat as no candidates rather than a hard error.
  let candidates: FECCommittee[] = [];
  try {
    candidates = await deps.fetchOrgs(normalizedInput);
  } catch {
    return { matched: false, lookupStatus: 'lookup_unavailable', normalizedInput };
  }
  const best = pickBestMatch(normalizedInput, candidates);

  if (!best) return { matched: false, lookupStatus: 'no_match', normalizedInput };

  const entity =
    deps.entities.find((e) => e.fecCommitteeId === best.org.orgid) ?? null;

  // Use bundled donationSummary when present and fresh — skips live API call.
  let donationSummary: DonationSummary | null = null;
  if (entity && shouldUseBundledSummary(entity.donationSummary, entity.lastVerifiedDate)) {
    donationSummary = entity.donationSummary;
  } else {
    try {
      donationSummary = await deps.fetchOrgSummary(best.org.orgid);
    } catch {
      // API unavailable — match still succeeds; card shows without donation data
    }
  }

  if (donationSummary) {
    await deps.setCache({
      key: cacheKey,
      fecCommitteeId: best.org.orgid,
      donationSummary,
      confidence: best.confidence,
      fetchedAt: Date.now(),
    });
  }

  return {
    matched: true,
    lookupStatus: 'matched',
    entity,
    committeeName: entity?.canonicalName ?? best.org.orgname,
    confidence: best.confidence,
    fecCommitteeId: best.org.orgid,
    donationSummary,
    fromCache: false,
  };
}

/**
 * Resolves a FEC committee ID for an entity that lacks one.
 * Throws on network failure — callers are responsible for catching and returning
 * lookupStatus: 'lookup_unavailable'.
 */
async function resolveOrgId(
  canonicalName: string,
  deps: MatchingDeps
): Promise<string | null> {
  const normalized = normalize(canonicalName);
  const candidates = await deps.fetchOrgs(normalized); // throws on network error
  const best = pickBestMatch(normalized, candidates);
  return best?.org.orgid ?? null;
}
