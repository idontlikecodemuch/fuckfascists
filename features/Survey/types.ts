/**
 * A digital platform or service tracked by the weekly survey.
 * Distinct from Entity (which covers physical businesses for the Map screen).
 */
export interface Platform {
  id: string;
  name: string;            // consumer-facing display name
  parentCompany: string;   // legal entity name used for FEC committee matching
  ceoName: string;
  categoryTags: string[];  // e.g. ['social', 'shopping', 'streaming']
  fecCommitteeId?: string; // pre-resolved for faster API calls
}

/**
 * A platform row as rendered in the survey list for a given week.
 * avoided=true means a PlatformAvoidEvent has been persisted this week.
 */
export interface SurveyItem {
  platform: Platform;
  avoided: boolean;
}
