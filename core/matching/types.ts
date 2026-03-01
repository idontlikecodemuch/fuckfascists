import type { Entity, ConfidenceLevel, DonationSummary, LocalCache } from '../models';

export interface OpenSecretsOrg {
  orgid: string;
  orgname: string;
}

export type MatchResult = MatchSuccess | MatchFailure;

export interface MatchSuccess {
  matched: true;
  entity: Entity | null;      // null when match is from OpenSecrets but not in curated list
  confidence: ConfidenceLevel;
  openSecretsOrgId: string;
  donationSummary: DonationSummary;
  fromCache: boolean;
}

export interface MatchFailure {
  matched: false;
  normalizedInput: string;    // caller uses this to build the OpenSecrets search link
}

export interface MatchingDeps {
  entities: Entity[];
  fetchOrgs: (normalizedName: string) => Promise<OpenSecretsOrg[]>;
  fetchOrgSummary: (orgId: string) => Promise<DonationSummary>;
  getCache: (key: string) => Promise<LocalCache | null>;
  setCache: (entry: LocalCache) => Promise<void>;
}
