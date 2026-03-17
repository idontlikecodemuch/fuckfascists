/**
 * A digital platform or service tracked by the avoidance screen.
 * Distinct from Entity (which covers physical businesses for the Map screen).
 */
export interface Platform {
  id: string;
  name: string;            // consumer-facing display name
  parentCompany: string;   // legal entity name used for FEC committee matching
  ceoName: string;
  publicFigureName?: string; // culturally recognizable figure (e.g. Musk for X/Twitter)
  categoryTags: string[];  // e.g. ['social', 'shopping', 'streaming']
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
