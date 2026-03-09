// IMPORTANT: Only affirmative avoidance actions are recorded.
// There is no "support" event type — by design.

export interface EntityAvoidEvent {
  entityId: string; // references canonical entity list
  date: string;     // YYYY-MM-DD only — no time, no location
  count: number;    // accumulated avoid count — set by DB on read, not by callers on write
}

export interface PlatformAvoidEvent {
  platformId: string; // references static platform list
  weekOf: string;     // YYYY-MM-DD (Monday of that week)
}
