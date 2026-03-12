// ── Extension-specific message types ─────────────────────────────────────────

export type FlagFrequency = 'session' | 'daily' | 'weekly';

/** Sent from content script → service worker on every page load */
export interface CheckDomainMsg {
  type: 'CHECK_DOMAIN';
  hostname: string;
  tabId: number;
}

/** Sent from popup → service worker to retrieve the active tab's flag */
export interface GetCurrentFlagMsg {
  type: 'GET_CURRENT_FLAG';
  tabId: number;
}

/** Sent from popup → service worker when user taps AVOIDED */
export interface AvoidEntityMsg {
  type: 'AVOID_ENTITY';
  tabId: number;
}

/** Sent from popup → service worker to snooze a domain for a given duration. */
export interface SnoozeDomainMsg {
  type: 'SNOOZE_DOMAIN';
  /** Hostname to snooze (e.g. "amazon.com") */
  hostname: string;
  /** Duration in milliseconds (default: 7 days) */
  durationMs: number;
}

/** Sent from popup → service worker to get weekly stats for the popup summary */
export interface GetWeeklyStatsMsg {
  type: 'GET_WEEKLY_STATS';
  weekOf: string;
}

export type ExtensionMsg =
  | CheckDomainMsg
  | GetCurrentFlagMsg
  | AvoidEntityMsg
  | SnoozeDomainMsg
  | GetWeeklyStatsMsg;

// ── Flag state stored per-tab in memory ───────────────────────────────────────

export interface TabFlag {
  hostname: string;
  entityId: string;
  canonicalName: string;
  /** Pre-computed getDisplayFigure() result — publicFigureName if set, otherwise ceoName. */
  displayFigure: string;
  donationDataAvailable: boolean;
  /**
   * True when the entity has no bundled donationSummary AND no live data was obtained.
   * Distinct from donationDataAvailable=false due to a transient API failure.
   * Drives "No bundled donation data." copy in the popup instead of "temporarily unavailable."
   */
  noBundledData: boolean;
  recentCycle: number | null;
  recentRepubs: number;
  recentDems: number;
  totalRepubs: number;
  totalDems: number;
  activeCycles: number[];
  fecCommitteeUrl: string | null;
  confidence: number; // 0–1 score; compare against CONFIDENCE_THRESHOLD_HIGH/MEDIUM for display
  avoided: boolean;
}

// ── Snooze record ─────────────────────────────────────────────────────────────

export interface SnoozeRecord {
  hostname: string;
  until: number; // epoch ms
}

// ── Weekly stats response ─────────────────────────────────────────────────────

export interface WeeklyStats {
  entityAvoidCount: number;
  platformAvoidCount: number;
  topEntityName: string | null;
}
