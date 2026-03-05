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
  const committeeId = match.entity?.fecCommitteeId ?? match.openSecretsOrgId;

  return {
    entityId: match.entity?.id ?? null,
    // Prefer the curated entity's canonicalName; fall back to FEC orgname.
    canonicalName: match.entity?.canonicalName ?? match.openSecretsOrgId,
    confidence: match.confidence,
    donationSummary: match.donationSummary,
    openSecretsOrgId: match.openSecretsOrgId,
    fecFilingUrl: committeeId ? fecFilingUrl(committeeId) : null,
    entity: match.entity,
  };
}
