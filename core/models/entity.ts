export interface Entity {
  id: string;
  canonicalName: string;       // matches OpenSecrets org name
  aliases: string[];           // consumer-facing brand names
  domains: string[];           // for extension matching (e.g. ["amazon.com", "smile.amazon.com"])
  categoryTags: string[];
  ceoName: string;             // for report card display
  openSecretsOrgId?: string;   // pre-resolved for fast API calls
  confidenceOverride?: 'HIGH'; // for well-known brands
  lastVerifiedDate: string;    // YYYY-MM-DD
}
