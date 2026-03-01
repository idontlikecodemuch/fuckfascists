import type { ConfidenceLevel } from '../models';
import type { OpenSecretsOrg } from './types';
import { normalize } from './normalize';
import { jaroWinkler } from './jaroWinkler';
import {
  CONFIDENCE_THRESHOLD_HIGH,
  CONFIDENCE_THRESHOLD_MEDIUM,
} from '../../config/constants';

export interface ScoredCandidate {
  org: OpenSecretsOrg;
  score: number;
}

export interface BestMatch {
  org: OpenSecretsOrg;
  score: number;
  confidence: ConfidenceLevel;
}

/**
 * Scores all OpenSecrets candidates against the normalized query.
 * Returns candidates sorted by score descending.
 */
export function scoreAll(
  normalizedQuery: string,
  candidates: OpenSecretsOrg[]
): ScoredCandidate[] {
  return candidates
    .map((org) => ({
      org,
      score: jaroWinkler(normalizedQuery, normalize(org.orgname)),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Returns the highest-scoring candidate that meets the minimum threshold,
 * or null if nothing clears CONFIDENCE_THRESHOLD_MEDIUM.
 */
export function pickBestMatch(
  normalizedQuery: string,
  candidates: OpenSecretsOrg[]
): BestMatch | null {
  const scored = scoreAll(normalizedQuery, candidates);
  if (scored.length === 0) return null;

  const best = scored[0];

  if (best.score >= CONFIDENCE_THRESHOLD_HIGH) {
    return { ...best, confidence: 'HIGH' };
  }
  if (best.score >= CONFIDENCE_THRESHOLD_MEDIUM) {
    return { ...best, confidence: 'MEDIUM' };
  }
  return null;
}
