import type { ConfidenceLevel, DonationSummary, Entity } from '../../core/models';

/**
 * The result of running a business name through the entity matching pipeline.
 * Safe to display — every field is either public OpenSecrets data or a
 * derived string. No coordinates. No personal data.
 */
export interface ScanResult {
  entityId: string | null;     // null when matched via FEC but not in curated list
  canonicalName: string;       // entity.canonicalName, or FEC orgname as fallback
  confidence: ConfidenceLevel;
  donationSummary: DonationSummary;
  openSecretsOrgId: string;    // holds FEC committee_id since FEC migration
  /** FEC filing URL — present when a committee ID is available (curated or live API). */
  fecFilingUrl: string | null;
  entity: Entity | null;
}

/**
 * A flagged business pinned on the map for this session.
 * coords are in-memory only — they are NEVER persisted or transmitted.
 */
export interface MapPin {
  id: string;                                           // entityId ?? openSecretsOrgId
  name: string;                                         // display name
  coords: { latitude: number; longitude: number };      // session-only
  result: ScanResult;
  avoided: boolean;                                     // toggled after user taps AVOIDED
}
