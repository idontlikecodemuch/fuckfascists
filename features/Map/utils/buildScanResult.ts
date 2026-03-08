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
    // Prefer the curated entity's canonicalName; fall back to committee ID as last resort.
    canonicalName: match.entity?.canonicalName ?? match.fecCommitteeId,
    confidence: match.confidence,
    donationSummary: match.donationSummary,
    fecCommitteeId: match.fecCommitteeId,
    fecFilingUrl: committeeId ? fecFilingUrl(committeeId) : null,
    entity: match.entity,
  };
}
