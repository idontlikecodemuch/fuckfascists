import type { LocalCache } from '../models';
import type { MatchResult, MatchingDeps } from './types';
import { normalize } from './normalize';
import { findByAlias } from './aliasMatch';
import { pickBestMatch } from './scorer';
import { ENTITY_CACHE_TTL_DAYS } from '../../config/constants';

function buildCacheKey(normalizedName: string, areaHash: string): string {
  return normalize(normalizedName + areaHash);
}

function isCacheExpired(fetchedAt: number): boolean {
  const ttlMs = ENTITY_CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - fetchedAt > ttlMs;
}

/**
 * Full entity matching pipeline. Steps:
 *  1. Normalize input
 *  2. Check LocalCache — return immediately on a valid hit
 *  3. Exact alias match against canonical entity list → HIGH confidence
 *  4. OpenSecrets getOrgs → Jaro-Winkler scoring → pick best match
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
      deps.entities.find((e) => e.openSecretsOrgId === cached.openSecretsOrgId) ??
      null;
    return {
      matched: true,
      entity,
      confidence: cached.confidence,
      openSecretsOrgId: cached.openSecretsOrgId,
      donationSummary: cached.donationSummary,
      fromCache: true,
    };
  }

  // Step 2: Exact alias match
  const aliasMatch = findByAlias(normalizedInput, deps.entities);
  if (aliasMatch) {
    const orgId =
      aliasMatch.openSecretsOrgId ?? (await resolveOrgId(aliasMatch.canonicalName, deps));

    if (!orgId) return { matched: false, normalizedInput };

    const donationSummary = await deps.fetchOrgSummary(orgId);
    const confidence = aliasMatch.confidenceOverride ?? 'HIGH';

    await deps.setCache({
      key: cacheKey,
      openSecretsOrgId: orgId,
      donationSummary,
      confidence,
      fetchedAt: Date.now(),
    });

    return {
      matched: true,
      entity: aliasMatch,
      confidence,
      openSecretsOrgId: orgId,
      donationSummary,
      fromCache: false,
    };
  }

  // Step 3: Fuzzy OpenSecrets search
  const candidates = await deps.fetchOrgs(normalizedInput);
  const best = pickBestMatch(normalizedInput, candidates);

  if (!best) return { matched: false, normalizedInput };

  const donationSummary = await deps.fetchOrgSummary(best.org.orgid);

  await deps.setCache({
    key: cacheKey,
    openSecretsOrgId: best.org.orgid,
    donationSummary,
    confidence: best.confidence,
    fetchedAt: Date.now(),
  });

  const entity =
    deps.entities.find((e) => e.openSecretsOrgId === best.org.orgid) ?? null;

  return {
    matched: true,
    entity,
    confidence: best.confidence,
    openSecretsOrgId: best.org.orgid,
    donationSummary,
    fromCache: false,
  };
}

/** Resolves an OpenSecrets org ID for an entity that lacks one. */
async function resolveOrgId(
  canonicalName: string,
  deps: MatchingDeps
): Promise<string | null> {
  const normalized = normalize(canonicalName);
  const candidates = await deps.fetchOrgs(normalized);
  const best = pickBestMatch(normalized, candidates);
  return best?.org.orgid ?? null;
}
