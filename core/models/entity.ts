export interface Entity {
  id: string;
  canonicalName: string;       // matches FEC committee/organization name
  aliases: string[];           // consumer-facing brand names
  domains: string[];           // for extension matching (e.g. ["amazon.com", "smile.amazon.com"])
  categoryTags: string[];
  ceoName: string;             // for report card display
  openSecretsOrgId?: string;   // @deprecated — holds FEC committee_id since FEC migration
  fecCommitteeId?: string;     // FEC committee ID — populated by the data pipeline after verification
  /**
   * Optional override score between 0 and 1.
   * When present, the pipeline uses this instead of computing Jaro-Winkler.
   * A value of 1.0 means exact/certain match.
   * Omit entirely when the pipeline should score normally.
   * Only use 1.0 for nationally unambiguous brands.
   */
  matchScore?: number;
  lastVerifiedDate: string;    // YYYY-MM-DD
}

/**
 * Constructs the canonical FEC filing URL for a given committee ID.
 * Pure function — safe to call in any context.
 */
export function fecFilingUrl(committeeId: string): string {
  return `https://www.fec.gov/data/committee/${committeeId}/`;
}
