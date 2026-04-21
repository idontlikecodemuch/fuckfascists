import type { FECCommittee } from './types';
import { normalize } from './normalize';
import { jaroWinkler } from './jaroWinkler';
import {
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
 * Tokens stripped from an FEC committee name before the content-token guard.
 * These are corporate/PAC suffixes and stopwords that are routinely present
 * regardless of the underlying company, so they carry no discriminating power.
 * Everything that remains should be an identifying word (e.g. "airlines",
 * "walmart", "meta") that must also appear in the input for a match to be
 * plausible.
 */
const FEC_CANDIDATE_STOPWORDS = new Set([
  'inc', 'corp', 'co', 'llc', 'lp', 'ltd', 'llp', 'plc',
  'pac', 'ppc',
  'committee', 'committees',
  'political', 'action',
  'corporation', 'company', 'companies', 'limited', 'group', 'holdings',
  'federal', 'fed',
  'the', 'of', 'and', 'for', 'to', 'a', 'an',
  'us', 'usa',
]);

/**
 * Content tokens from an FEC committee name — normalized, whitespace-split,
 * stopwords removed. Drives the token-safety guard in pickBestMatch.
 */
function candidateContentTokens(orgname: string): string[] {
  return normalize(orgname)
    .split(/\s+/)
    .filter(Boolean)
    .filter((t) => !FEC_CANDIDATE_STOPWORDS.has(t));
}

/**
 * Guard against high-JW-score false positives where the committee name shares
 * only a generic prefix with the input (e.g. "American Association of Teachers
 * of German" vs "American Airlines" scores ~0.85 on Jaro-Winkler because of
 * the shared "American " prefix, then fabricates an American Airlines PAC
 * match for an unrelated nonprofit).
 *
 * Requires every discriminating token of the candidate committee name to
 * appear in the input's token set. Stopwords/corporate suffixes are stripped
 * so committee names like "WALMART INC" still pass when the user types just
 * "Walmart".
 *
 * Returns false when no content tokens remain after stopword stripping — such
 * a committee name carries no identifying signal (e.g. "The Federal PAC") and
 * should not be accepted on JW score alone.
 */
export function candidateTokensAppearInInput(
  normalizedInput: string,
  orgname: string,
): boolean {
  const inputTokens = new Set(
    normalizedInput.split(/\s+/).filter(Boolean),
  );
  const coreTokens = candidateContentTokens(orgname);
  if (coreTokens.length === 0) return false;
  return coreTokens.every((t) => inputTokens.has(t));
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
 * Returns the highest-scoring candidate that clears both
 * CONFIDENCE_THRESHOLD_MEDIUM and the content-token safety guard, or null
 * if nothing qualifies.
 *
 * The token guard protects against JW false positives where a shared prefix
 * (e.g. "American ") pushes the score above threshold even though the rest of
 * the names are unrelated. When the top-scored candidate fails the guard we
 * walk further down the sorted list until we find one that passes both checks
 * or exhaust the threshold.
 */
export function pickBestMatch(
  normalizedQuery: string,
  candidates: FECCommittee[]
): BestMatch | null {
  const scored = scoreAll(normalizedQuery, candidates);
  for (const cand of scored) {
    if (cand.score < CONFIDENCE_THRESHOLD_MEDIUM) return null;
    if (candidateTokensAppearInInput(normalizedQuery, cand.org.orgname)) {
      return { ...cand, confidence: cand.score };
    }
  }
  return null;
}
