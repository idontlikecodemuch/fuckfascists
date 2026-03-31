// ── Raw JSON schema (assets/data/platforms.json) ─────────────────────────────

/** A child platform inside a group entry in platforms.json. */
export interface RawPlatformChild {
  id: string;
  name: string;
  defaultSelected: boolean;
  sortOrder: number;
}

/**
 * A group entry in platforms.json: one parent company with multiple child services.
 * Children inherit the group's entityId for entity enrichment.
 * Avoidance is recorded at child level only; the group itself is a display container.
 */
export interface RawPlatformGroup {
  id: string;
  name: string;
  entityId: string;
  sortOrder: number;
  children: RawPlatformChild[];
}

/** A standalone platform entry in platforms.json (no children). */
export interface RawPlatformSingleton {
  id: string;
  name: string;
  entityId: string;
  defaultSelected: boolean;
  sortOrder: number;
}

export type RawPlatformEntry = RawPlatformGroup | RawPlatformSingleton;

/** Top-level shape of assets/data/platforms.json. */
export interface PlatformFile {
  version: number;
  platforms: RawPlatformEntry[];
}

// ── Runtime platform (used by all components) ─────────────────────────────────

/**
 * A digital platform or service tracked by the avoidance screen.
 * Produced by flattenPlatforms() from platforms.json + entity enrichment.
 * Distinct from Entity (which covers physical businesses for the Map screen).
 */
export interface Platform {
  id: string;
  name: string;              // consumer-facing display name
  entityId: string;          // links to entities.json id
  parentCompany: string;     // entity.canonicalName — used for grouping in buildListData
  ceoName: string;           // entity.ceoName — display / sprite resolution
  publicFigureName?: string; // entity.publicFigureName (e.g. Musk for X/Twitter)
  categoryTags: string[];    // entity.categoryTags (e.g. ['social', 'shopping'])
  sortOrder: number;         // from JSON — controls display sequence
  defaultSelected: boolean;  // from JSON — pre-checked for new users on setup screen
}

/**
 * A platform row as rendered in the platform list for a given week.
 * weeklyCount is the sum of all daily avoid counts for the current week.
 * dayCounts maps YYYY-MM-DD → avoid count for day-circle rendering.
 */
export interface PlatformItem {
  platform: Platform;
  weeklyCount: number;
  dayCounts: Map<string, number>;
}
