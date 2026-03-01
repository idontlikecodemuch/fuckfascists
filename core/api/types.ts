// Raw JSON shapes returned by the OpenSecrets API (?output=json).
// These are internal to core/api — callers work with domain types from core/models.

interface RawOrgAttributes {
  orgid: string;
  orgname: string;
}

interface RawOrgEntry {
  '@attributes': RawOrgAttributes;
}

// OpenSecrets returns a single object when there is exactly one result
// and an array when there are multiple. Both cases must be handled.
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
