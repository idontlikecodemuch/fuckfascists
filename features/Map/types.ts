import type { ConfidenceLevel, DonationSummary, Entity } from '../../core/models';

export type ScanContext =
  | {
      kind: 'barcode';
      barcode: string;
      productName: string | null;
      brandName: string | null;
      source: 'cache' | 'open_food_facts' | 'bundled_prefix';
    };

/**
 * The result of running a business name through the entity matching pipeline.
 * Safe to display — every field is either public FEC data or a
 * derived string. No coordinates. No personal data.
 */
export interface ScanResult {
  entityId: string | null;     // null when matched via FEC but not in curated list
  canonicalName: string;       // entity.canonicalName, or FEC orgname as fallback
  /** The user-recognizable name that triggered the match (alias, search term, or fuzzy input). */
  matchedAlias: string;
  /** FEC committee display name — grounds donation data to its source PAC. */
  committeeName: string | null;
  confidence: ConfidenceLevel;
  donationSummary: DonationSummary | null;
  fecCommitteeId: string;      // FEC committee ID from the matched entity or live API
  /** FEC filing URL — present when a committee ID is available (curated or live API). */
  fecFilingUrl: string | null;
  entity: Entity | null;
  context?: ScanContext | null;
}

/**
 * A flagged business pinned on the map.
 * Coordinates are stored locally only for avoided pins (auto-purged daily).
 * Non-avoided pin coords are in-memory only — never persisted.
 */
export interface MapPin {
  id: string;                                           // entityId ?? fecCommitteeId
  name: string;                                         // display name
  coords: { latitude: number; longitude: number };
  result: ScanResult | null;                            // null for hydrated avoid-only pins
  avoided: boolean;                                     // toggled after user taps AVOIDED
}
