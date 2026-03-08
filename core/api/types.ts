// Legacy raw JSON shapes from the old OpenSecrets API — no longer used by FECClient.
// These are internal to core/api — callers work with domain types from core/models.

interface RawOrgAttributes {
  orgid: string;
  orgname: string;
}

interface RawOrgEntry {
  '@attributes': RawOrgAttributes;
}

// The old OpenSecrets API returned a single object for one result and an array
// for multiple. Both cases were handled here.
export interface GetOrgsResponse {
  response: {
    organization?: RawOrgEntry | RawOrgEntry[];
  };
}

interface RawOrgSummaryAttributes {
  org_name: string;
  orgid: string;
  total: string;     // USD as a numeric string
  dems: string;
  repubs: string;
  lobbying: string;
  source: string;    // attribution URL
  cycle: string;     // e.g. "2024"
}

export interface GetOrgSummaryResponse {
  response: {
    organization?: {
      '@attributes': RawOrgSummaryAttributes;
    };
  };
}
