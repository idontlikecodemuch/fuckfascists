import type { ConfidenceLevel } from './confidence';

export interface DonationSummary {
  committeeId: string;
  committeeName: string;
  recentCycle: number;           // most recent election year e.g. 2024
  recentRepubs: number;          // Republican donations in most recent cycle only
  recentDems: number;            // Democrat donations in most recent cycle only
  totalRepubs: number;           // total Republican donations from 2016 onward
  totalDems: number;             // total Democrat donations from 2016 onward
  activeCycles: number[];        // all cycles with activity since 2016, ascending
  lastUpdated: string;           // YYYY-MM-DD
  fecCommitteeUrl: string;       // https://www.fec.gov/data/committee/{committeeId}/
}

export interface LocalCache {
  key: string;                    // normalized(brandName + areaHash) — NOT lat/long coords
  openSecretsOrgId: string;
  donationSummary: DonationSummary;
  confidence: ConfidenceLevel;
  fetchedAt: number;              // Unix timestamp — checked against ENTITY_CACHE_TTL_DAYS
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function makeFecCommitteeUrl(committeeId: string): string {
  return `https://www.fec.gov/data/committee/${committeeId}/`;
}

export function formatDonationAmount(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)     return `$${Math.round(amount / 1_000)}K`;
  return `$${amount.toLocaleString()}`;
}

export function formatActiveCycles(cycles: number[]): string {
  return cycles.join(', ');
}

/**
 * Returns a human-readable label for an FEC election cycle year.
 * FEC cycles are even-numbered years (the year the election occurs).
 * 2024 → "2023–24", 2022 → "2021–22", 2016 → "2015–16"
 */
export function formatCycleLabel(cycle: number): string {
  const startYear = cycle - 1;
  const endTwoDigit = String(cycle).slice(2);
  return `${startYear}–${endTwoDigit}`;
}
