import type { Entity, ConfidenceLevel, DonationSummary, LocalCache } from '../models';

export interface FECCommittee {
  orgid: string;
  orgname: string;
}

/**
 * 'matched'            — confident or medium-confidence match found
 * 'no_match'           — lookup completed successfully, no confident match
 * 'lookup_unavailable' — lookup failed (network error, rate limit, timeout)
 */
export type LookupStatus = 'matched' | 'no_match' | 'lookup_unavailable';

export type MatchResult = MatchSuccess | MatchFailure;

export interface MatchSuccess {
  matched: true;
  lookupStatus: 'matched';
  entity: Entity | null;        // null when matched via FEC but not in curated list
  /** Human-readable committee name from FEC — used as display fallback when entity is null. */
  committeeName: string | null;
  confidence: ConfidenceLevel;
  fecCommitteeId: string;
  donationSummary: DonationSummary | null;
  fromCache: boolean;
}

export interface MatchFailure {
  matched: false;
  lookupStatus: 'no_match' | 'lookup_unavailable';
  normalizedInput: string;    // caller uses this to build the FEC search link
}

export interface MatchingDeps {
  entities: Entity[];
  fetchOrgs: (normalizedName: string) => Promise<FECCommittee[]>;
  fetchOrgSummary: (orgId: string) => Promise<DonationSummary | null>;
  getCache: (key: string) => Promise<LocalCache | null>;
  setCache: (entry: LocalCache) => Promise<void>;
}
