// IMPORTANT: Only affirmative avoidance actions are recorded.
// There is no "support" event type — by design.

export interface EntityAvoidEvent {
  entityId: string;    // references canonical entity list
  date: string;        // YYYY-MM-DD only — no time, no location
  count: number;       // accumulated avoid count — set by DB on read, not by callers on write
  surface?: number;    // numeric surface indicator (1=map, 2=scan) — privacy-safe, encrypted at rest
}

export interface PlatformAvoidEvent {
  platformId: string; // references static platform list
  date: string;       // YYYY-MM-DD — no time, no location
  count: number;      // accumulated avoid count — set by DB on read, not by callers on write
}

/**
 * Persisted map pin for an avoided entity — used to hydrate the map on launch.
 *
 * PRIVACY RELAXATION: Stores coordinates locally (encrypted at rest).
 * Only for avoided entities, auto-purged daily. See Known Limitations in CLAUDE.md.
 */
export interface AvoidPin {
  entityId: string;
  date: string;       // YYYY-MM-DD
  latitude: number;
  longitude: number;
  name: string;       // display name for the marker
}
