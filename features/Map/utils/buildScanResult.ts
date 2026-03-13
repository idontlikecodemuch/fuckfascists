import type { MatchSuccess } from '../../../core/matching';
import { fecFilingUrl } from '../../../core/models';
import type { ScanResult } from '../types';

/**
 * Converts a successful MatchResult into a ScanResult for display.
 * Pure function — no side effects, no I/O. Extracted for testability.
 */
export function buildScanResult(match: MatchSuccess): ScanResult {
  // FEC filing URL: prefer the curated entity's verified committeeId,
  // fall back to the committee_id returned by the live FEC API search.
  const committeeId = match.entity?.fecCommitteeId || match.fecCommitteeId || null;

  return {
    entityId: match.entity?.id ?? null,
    // Prefer the curated entity's canonicalName; fall back to FEC committee name from
    // the API search result; use committee ID only as a last resort (should not be
    // user-visible, but prevents an empty string if something upstream is wrong).
    canonicalName: match.entity?.canonicalName ?? match.committeeName ?? match.fecCommitteeId,
    confidence: match.confidence,
    donationSummary: match.donationSummary,
    fecCommitteeId: match.fecCommitteeId,
    fecFilingUrl: committeeId ? fecFilingUrl(committeeId) : null,
    entity: match.entity,
  };
}
