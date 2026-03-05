export interface Entity {
  id: string;
  canonicalName: string;       // matches FEC committee/organization name
  aliases: string[];           // consumer-facing brand names
  domains: string[];           // for extension matching (e.g. ["amazon.com", "smile.amazon.com"])
  categoryTags: string[];
  ceoName: string;             // for report card display
  /**
   * Optional. The founder, owner, or controlling public figure most associated
   * with this company's political identity. Use when this person is more
   * culturally recognizable than the current operational CEO.
   * Examples: Jeff Bezos (Amazon), Rupert Murdoch (Fox/News Corp),
   *           Charles Koch (Koch Industries)
   * When absent, ceoName is used for display purposes.
   */
  publicFigureName?: string;
  /**
   * Optional. The id of the parent entity if this is a subsidiary.
   * When present, the report card ladders up to the parent's displayFigure
   * instead of this entity's own ceoName/publicFigureName.
   * Example: { id: "instagram", parentEntityId: "meta" }
   */
  parentEntityId?: string;
  /**
   * Optional. IDs referencing entries in assets/data/people.json.
   * Links this entity to individual executive/donor records for personal
   * FEC contribution data. Currently unused in display — reserved for future use.
   */
  associatedPersonIds?: string[];
  openSecretsOrgId?: string;   // @deprecated — holds FEC committee_id since FEC migration
  fecCommitteeId?: string;     // FEC committee ID — populated by the data pipeline after verification
  /**
   * Optional override score between 0 and 1.
   * When present, the pipeline uses this instead of computing Jaro-Winkler.
   * A value of 1.0 means exact/certain match.
   * Omit entirely when the pipeline should score normally.
   * Only use 1.0 for nationally unambiguous brands.
   */
  matchScore?: number;
  lastVerifiedDate: string;    // YYYY-MM-DD
}

/**
 * Returns the public figure name most associated with this entity's political
 * identity. Falls back to ceoName when publicFigureName is not set.
 * Pure function — safe to call in any context.
 */
export function getDisplayFigure(entity: Entity): string {
  return entity.publicFigureName ?? entity.ceoName;
}

/**
 * Constructs the canonical FEC filing URL for a given committee ID.
 * Pure function — safe to call in any context.
 */
export function fecFilingUrl(committeeId: string): string {
  return `https://www.fec.gov/data/committee/${committeeId}/`;
}
