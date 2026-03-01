/**
 * Aggregated display data for one week's report card.
 * All fields are derived from local storage — no server-side data.
 */
export interface ReportCardData {
  weekOf: string;                      // YYYY-MM-DD Monday
  entityAvoids: EntityAvoidSummary[];  // sorted by count desc
  platformAvoids: string[];            // display names of avoided platforms
  totalEntityAvoids: number;           // sum of all entity avoid counts
  totalPlatformAvoids: number;
  isPreview: boolean;                  // true → show PREVIEW stamp
}

export interface EntityAvoidSummary {
  entityId: string;
  name: string;     // canonicalName from entity list, or entityId as fallback
  count: number;
  ceoName?: string;
}

/**
 * The weekly drop time fetched from the CDN.
 * Published by a GitHub Action each Monday — read-only, no auth required.
 */
export interface DropSchedule {
  dropAt: number;  // Unix timestamp in ms
  weekOf: string;  // YYYY-MM-DD Monday this schedule covers
}
