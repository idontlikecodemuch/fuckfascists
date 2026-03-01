import type { ConfidenceLevel } from './confidence';

// Concrete shape of the OpenSecrets orgSummary response.
// All dollar amounts are in USD as returned by the API.
export interface DonationSummary {
  orgName: string;
  orgId: string;
  total: number;      // total political donations in USD
  dems: number;       // donations to Democrats in USD
  repubs: number;     // donations to Republicans in USD
  lobbying: number;   // lobbying expenditure in USD
  sourceUrl: string;  // OpenSecrets attribution URL — must be shown in UI
  cycle: string;      // election cycle year e.g. "2024"
}

export interface LocalCache {
  key: string;                    // normalized(brandName + areaHash) — NOT lat/long coords
  openSecretsOrgId: string;
  donationSummary: DonationSummary;
  confidence: ConfidenceLevel;
  fetchedAt: number;              // Unix timestamp — checked against ENTITY_CACHE_TTL_DAYS
}
