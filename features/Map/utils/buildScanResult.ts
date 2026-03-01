import type { MatchSuccess } from '../../../core/matching';
import type { ScanResult } from '../types';

/**
 * Converts a successful MatchResult into a ScanResult for display.
 * Pure function — no side effects, no I/O. Extracted for testability.
 */
export function buildScanResult(match: MatchSuccess): ScanResult {
  return {
    entityId: match.entity?.id ?? null,
    // Prefer the curated entity's canonicalName; fall back to OpenSecrets orgname.
    canonicalName: match.entity?.canonicalName ?? match.openSecretsOrgId,
    confidence: match.confidence,
    donationSummary: match.donationSummary,
    openSecretsOrgId: match.openSecretsOrgId,
    entity: match.entity,
  };
}
