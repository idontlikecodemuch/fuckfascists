import type { FECCommittee } from './types';
import { normalize } from './normalize';
import { jaroWinkler } from './jaroWinkler';
import {
  CONFIDENCE_THRESHOLD_HIGH,
  CONFIDENCE_THRESHOLD_MEDIUM,
} from '../../config/constants';

export interface ScoredCandidate {
  org: FECCommittee;
  score: number;
}

export interface BestMatch {
  org: FECCommittee;
  score: number;
  confidence: number; // 0–1 score passed through from the JW scoring step
}

/**
 * Scores all FEC committee candidates against the normalized query.
 * Returns candidates sorted by score descending.
 */
export function scoreAll(
  normalizedQuery: string,
  candidates: FECCommittee[]
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
  candidates: FECCommittee[]
): BestMatch | null {
  const scored = scoreAll(normalizedQuery, candidates);
  if (scored.length === 0) return null;

  const best = scored[0];

  if (best.score >= CONFIDENCE_THRESHOLD_MEDIUM) {
    return { ...best, confidence: best.score };
  }
  return null;
}
