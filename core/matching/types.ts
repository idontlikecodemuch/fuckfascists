import type { Entity, ConfidenceLevel, DonationSummary, LocalCache } from '../models';

export interface FECCommittee {
  orgid: string;
  orgname: string;
}

export type MatchResult = MatchSuccess | MatchFailure;

export interface MatchSuccess {
  matched: true;
  entity: Entity | null;      // null when matched via FEC but not in curated list
  confidence: ConfidenceLevel;
  fecCommitteeId: string;
  donationSummary: DonationSummary | null;
  fromCache: boolean;
}

export interface MatchFailure {
  matched: false;
  normalizedInput: string;    // caller uses this to build the FEC search link
}

export interface MatchingDeps {
  entities: Entity[];
  fetchOrgs: (normalizedName: string) => Promise<FECCommittee[]>;
  fetchOrgSummary: (orgId: string) => Promise<DonationSummary | null>;
  getCache: (key: string) => Promise<LocalCache | null>;
  setCache: (entry: LocalCache) => Promise<void>;
}
