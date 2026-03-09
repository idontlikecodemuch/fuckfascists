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
  if (cached && !isCacheExpired(cached.fetchedAt)) {
    const entity =
      deps.entities.find((e) => e.fecCommitteeId === cached.fecCommitteeId) ??
      null;
    return {
      matched: true,
      entity,
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
    const orgId =
      (aliasMatch.fecCommitteeId != null && aliasMatch.fecCommitteeId !== '')
        ? aliasMatch.fecCommitteeId
        : await resolveOrgId(aliasMatch.canonicalName, deps);

    if (!orgId) return { matched: false, normalizedInput };

    const confidence = scoreToConfidence(aliasMatch.matchScore);
    if (confidence === null) return { matched: false, normalizedInput };

    // Use bundled donationSummary when present and fresh — skips live API call.
    let donationSummary: DonationSummary | null = null;
    if (aliasMatch.donationSummary && isBundledSummaryFresh(aliasMatch.lastVerifiedDate)) {
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
      entity: aliasMatch,
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
    return { matched: false, normalizedInput };
  }
  const best = pickBestMatch(normalizedInput, candidates);

  if (!best) return { matched: false, normalizedInput };

  const entity =
    deps.entities.find((e) => e.fecCommitteeId === best.org.orgid) ?? null;

  // Use bundled donationSummary when present and fresh — skips live API call.
  let donationSummary: DonationSummary | null = null;
  if (entity?.donationSummary && isBundledSummaryFresh(entity.lastVerifiedDate)) {
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
    entity,
    confidence: best.confidence,
    fecCommitteeId: best.org.orgid,
    donationSummary,
    fromCache: false,
  };
}

/** Resolves a FEC committee ID for an entity that lacks one. */
async function resolveOrgId(
  canonicalName: string,
  deps: MatchingDeps
): Promise<string | null> {
  const normalized = normalize(canonicalName);
  let candidates: FECCommittee[] = [];
  try {
    candidates = await deps.fetchOrgs(normalized);
  } catch {
    return null;
  }
  const best = pickBestMatch(normalized, candidates);
  return best?.org.orgid ?? null;
}
