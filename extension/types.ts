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

import type { PoliticalPerson, PoliticalPersonDonationSummary } from '../core/models';
import type { BannerVariant } from '../features/Map/components/cardMode';

/**
 * Slim PoliticalPerson for the SW→popup message boundary. Structurally
 * compatible with PoliticalPerson so it can be passed directly to
 * getPersonDisplayName, makeFecIndividualUrl, and deriveDonationSummary.
 * donationSummary.raw[] is stripped before send to keep payload small —
 * the popup only renders summary math + metadata for the "Based on" links.
 */
export type TabFlagPerson = Omit<PoliticalPerson, 'donationSummary'> & {
  donationSummary?: Omit<PoliticalPersonDonationSummary, 'raw'> & { raw: [] };
};

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
  /**
   * True when a live FEC API call was attempted but failed (network error, timeout, rate limit).
   * When true the popup shows "Couldn't reach FEC — try again later." instead of the generic
   * unavailable message. Takes precedence over noBundledData in the popup copy.
   */
  liveLookupFailed: boolean;
  recentCycle: number | null;
  recentRepubs: number;
  recentDems: number;
  totalRepubs: number;
  totalDems: number;
  totalO: number;
  activeCycles: number[];
  fecCommitteeUrl: string | null;
  confidence: number; // 0–1 score; compare against CONFIDENCE_THRESHOLD_HIGH/MEDIUM for display
  avoided: boolean;

  // ── Cross-surface parity fields (Principle #8) ──────────────────────────────
  // Mirror the app's card: linked donor-people contribute to totals + source
  // list, and the SW pre-computes the unified card-vs-banner routing so the
  // popup just renders.

  /** Entity canonicalName — enables short-PAC label derivation in the popup. */
  entityName: string;
  /**
   * Entity's fecCommitteeId, forwarded so popup copy can reason about the
   * three states:
   *  - non-empty string = confirmed PAC ID
   *  - empty string     = unverified
   *  - null             = confirmed no PAC
   */
  entityFecCommitteeId: string | null;
  /** PAC full committee name — "Based on" PAC source link label. */
  committeeName: string | null;
  /**
   * Donors/executives linked to this entity (or its parent) whose Schedule A
   * totals roll into the displayed numbers + drive the "Based on" source list.
   * raw[] stripped for payload size.
   */
  associatedPeople: TabFlagPerson[];
  /**
   * Pre-computed by resolveCardMode on the SW side. The popup branches on this
   * — 'card' renders the full donation view, 'banner' renders a lightweight
   * unavailable-reason row. Single source of truth shared with the app.
   */
  cardMode: 'card' | { banner: BannerVariant };
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
