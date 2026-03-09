import type { DonationSummary } from './cache';

/**
 * A single FEC committee record for an entity. Entities may have more than one
 * PAC over time (dissolved + re-registered), or in rare cases multiple simultaneously
 * active PACs (e.g. separate PACs for divisions).
 *
 * The data pipeline uses the active record's id as the primary fecCommitteeId for
 * fetching. Dissolved records are logged but not fetched.
 */
export interface FecCommitteeRecord {
  id: string;                        // e.g. "C00545277"
  status: 'active' | 'dissolved';
  registeredYear?: number;           // e.g. 2025
  dissolvedYear?: number;            // e.g. 2022
}

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
  /**
   * FEC committee ID, with three distinct states:
   *   string  — committee ID confirmed and populated by the data pipeline
   *   null    — confirmed no corporate PAC (e.g. Tesla; see notes field)
   *   ""      — not yet verified (default; pipeline will attempt to fill)
   *
   * When fecCommitteeRecords is present, the data pipeline uses the active
   * record's id here as the primary fetch target.
   */
  fecCommitteeId?: string | null;
  /**
   * Optional. Full list of known FEC committee records for this entity, covering
   * dissolved and active PACs. When present, the data pipeline uses the active
   * record's id as the primary fecCommitteeId for fetching and logs dissolved
   * records without fetching their data.
   *
   * Enables accurate data for entities that have dissolved a former PAC and
   * registered a new one (e.g. att, exxonmobil, verizon, wells-fargo,
   * goldman-sachs, apple, koch-industries).
   */
  fecCommitteeRecords?: FecCommitteeRecord[];
  /**
   * Optional override score between 0 and 1.
   * When present, the pipeline uses this instead of computing Jaro-Winkler.
   * A value of 1.0 means exact/certain match.
   * Omit entirely when the pipeline should score normally.
   * Only use 1.0 for nationally unambiguous brands.
   */
  matchScore?: number;
  /**
   * Optional. Bundled donation summary from the curated data pipeline.
   * When present and fresh (within ENTITY_CACHE_TTL_DAYS of lastVerifiedDate),
   * the matching pipeline uses this directly and skips the live FEC API call.
   */
  donationSummary?: DonationSummary;
  lastVerifiedDate: string;    // YYYY-MM-DD
}

/**
 * Returns the public figure name most associated with this entity's political
 * identity. Falls back to ceoName when publicFigureName is not set.
 *
 * When allEntities is provided and the entity has a parentEntityId, ladders
 * up to the parent's display figure so subsidiaries (e.g. Instagram, LinkedIn)
 * surface the controlling figure (e.g. Mark Zuckerberg, Satya Nadella).
 *
 * Pure function — safe to call in any context.
 */
export function getDisplayFigure(entity: Entity, allEntities?: Entity[]): string {
  if (entity.parentEntityId && allEntities) {
    const parent = allEntities.find((e) => e.id === entity.parentEntityId);
    if (parent) return getDisplayFigure(parent);
  }
  return entity.publicFigureName ?? entity.ceoName;
}

/**
 * Returns the parent entity for a subsidiary, or undefined if the entity has
 * no parentEntityId or the parent is not found in allEntities.
 */
export function getParentEntity(
  entity: Entity,
  allEntities: Entity[]
): Entity | undefined {
  if (!entity.parentEntityId) return undefined;
  return allEntities.find((e) => e.id === entity.parentEntityId);
}

/**
 * Constructs the canonical FEC filing URL for a given committee ID.
 * Pure function — safe to call in any context.
 */
export function fecFilingUrl(committeeId: string): string {
  return `https://www.fec.gov/data/committee/${committeeId}/`;
}
