import type { ScorecardPerson } from './data/aggregateScorecard';
import type { PowerTier } from './data/computePowerTier';

/**
 * Display data for the scorecard view.
 * All fields are derived from local storage — no server-side data.
 * Persons are grouped by public figure name, sorted by totalCount desc.
 */
export interface ScorecardViewData {
  weekOf: string;                    // YYYY-MM-DD Saturday (Sat–Fri week)
  persons: ScorecardPerson[];        // grouped by figure, sorted desc by totalCount
  grandTotal: number;                // sum of all person totalCounts
  powerTier: PowerTier | null;       // power meter tier for rendered card
  isPreview: boolean;                // true → show PREVIEW stamp
}

/**
 * The weekly drop time, computed on-device by the deterministic PRNG in
 * core/dropSchedule/computeDropTime.ts. No network required.
 */
export interface DropSchedule {
  dropAt: number;  // Unix timestamp in ms
  weekOf: string;  // YYYY-MM-DD local Monday of the week this schedule covers
}
