import type { DonationSummary } from '../models';
import { makeFecCommitteeUrl } from '../models';
import type { FECCommittee } from '../matching/types';
import { RateLimiter, FEC_DEFAULT_LIMITS } from './rateLimit';
import { RateLimitError } from './errors'; // eslint-disable-line @typescript-eslint/no-unused-vars -- re-thrown by RateLimiter
import { FEC_API_BASE_URL } from '../../config/constants';

// ── Error classes ──────────────────────────────────────────────────────────────

export class FECError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FECError';
  }
}

export class FECNetworkError extends FECError {
  constructor(cause: string) {
    super(`Network error calling FEC API: ${cause}`);
    this.name = 'FECNetworkError';
  }
}

export class FECParseError extends FECError {
  constructor(detail: string) {
    super(`Failed to parse FEC response: ${detail}`);
    this.name = 'FECParseError';
  }
}

// Cycles to fetch — 2016 through 2024 (update when a new cycle begins).
const CYCLES_SINCE_2016 = [2016, 2018, 2020, 2022, 2024] as const;

// ── FEC API response shapes ────────────────────────────────────────────────────

interface FECSearchResponse {
  results: Array<{ committee_id: string; name: string; party_full?: string }>;
}

interface FECDetailsResponse {
  results: Array<{ committee_id: string; name: string; party_full?: string }>;
}

interface FECTotalsResult {
  receipts?: number;
  cycle?: number;
}

interface FECTotalsResponse {
  results: FECTotalsResult[];
}

// ── Client ─────────────────────────────────────────────────────────────────────

export interface FECClientConfig {
  /** Defaults to process.env.FEC_API_KEY. When absent, client runs in anonymous mode (no api_key param). */
  apiKey?: string;
  rateLimiter?: RateLimiter;
}

export class FECClient {
  private readonly apiKey: string | null;
  private readonly rateLimiter: RateLimiter;

  constructor(config: FECClientConfig = {}) {
    const key = config.apiKey ?? process.env['FEC_API_KEY'] ?? null;
    if (!key && process.env['NODE_ENV'] !== 'production') {
      console.warn('[FECClient] No FEC_API_KEY found — running in anonymous mode. Rate limits may be stricter.');
    }
    this.apiKey = key;
    this.rateLimiter = config.rateLimiter ?? new RateLimiter(FEC_DEFAULT_LIMITS);
  }

  /**
   * Searches FEC committees by name.
   * Satisfies MatchingDeps.fetchOrgs — returns orgid/orgname pairs.
   */
  async fetchOrgs(name: string): Promise<FECCommittee[]> {
    return this.searchCommittees(name);
  }

  /**
   * Fetches donation summary for a committee.
   * Satisfies MatchingDeps.fetchOrgSummary.
   *
   * Returns null when committeeId is null (confirmed no PAC — no API call made).
   */
  async fetchOrgSummary(committeeId: string | null): Promise<DonationSummary | null> {
    if (committeeId === null) return null;
    return this.getCommitteeTotals(committeeId);
  }

  /**
   * Searches FEC for committees matching `name`.
   * Returns up to 20 results as orgid/orgname pairs for the matching pipeline.
   */
  async searchCommittees(name: string): Promise<FECCommittee[]> {
    const params = new URLSearchParams({ q: name, per_page: '20' });
    if (this.apiKey) params.set('api_key', this.apiKey);
    const data = await this.get<FECSearchResponse>(`/committees/?${params}`);
    return (data.results ?? []).map((c) => ({
      orgid: c.committee_id,
      orgname: c.name,
    }));
  }

  /**
   * Fetches donation totals for `committeeId` across all cycles from 2016 onward.
   * Makes two parallel API calls: committee details (name + party) + multi-cycle totals.
   *
   * - recentCycle / recentRepubs / recentDems: first (most recent) result only
   * - totalRepubs / totalDems: summed across all returned results
   * - activeCycles: all cycle years present in results, sorted ascending
   */
  async getCommitteeTotals(committeeId: string): Promise<DonationSummary> {
    const id = encodeURIComponent(committeeId);
    const cycleParams = CYCLES_SINCE_2016.map((c) => `cycle=${c}`).join('&');
    const keyParam = this.apiKey ? `&api_key=${encodeURIComponent(this.apiKey)}` : '';

    const [detailsData, totalsData] = await Promise.all([
      this.get<FECDetailsResponse>(`/committee/${id}/?per_page=1${keyParam}`),
      this.get<FECTotalsResponse>(
        `/committee/${id}/totals/?per_page=10&sort=-cycle&${cycleParams}${keyParam}`
      ),
    ]);

    const detailsRow = (detailsData.results ?? [])[0];
    if (!detailsRow) {
      throw new FECParseError(`No details returned for committee ${committeeId}`);
    }

    const results = totalsData.results;
    if (results.length === 0) {
      throw new FECParseError(`No totals data for committee ${committeeId}`);
    }

    const party = (detailsRow.party_full ?? '').toUpperCase();
    const isRepublican = party.includes('REPUBLICAN');
    const isDemocrat   = party.includes('DEMOCRAT');

    // Most recent cycle (first result — API sorts by -cycle)
    const recent = results[0]!;
    const recentReceipts = recent.receipts ?? 0;
    const recentCycle    = recent.cycle ?? 0;

    // Sum across all cycles
    let totalRepubs = 0;
    let totalDems   = 0;
    const activeCycles: number[] = [];

    for (const row of results) {
      const receipts = row.receipts ?? 0;
      if (isRepublican) totalRepubs += receipts;
      if (isDemocrat)   totalDems   += receipts;
      if (row.cycle != null) activeCycles.push(row.cycle);
    }

    activeCycles.sort((a, b) => a - b);

    const today = new Date().toISOString().slice(0, 10);

    return {
      committeeId,
      committeeName:   detailsRow.name,
      recentCycle,
      recentRepubs:    isRepublican ? recentReceipts : 0,
      recentDems:      isDemocrat   ? recentReceipts : 0,
      totalRepubs,
      totalDems,
      activeCycles,
      lastUpdated:     today,
      fecCommitteeUrl: makeFecCommitteeUrl(committeeId),
    };
  }

  private async get<T>(path: string): Promise<T> {
    this.rateLimiter.throttle(); // throws RateLimitError if exhausted

    const url = `${FEC_API_BASE_URL}${path}`;
    let response: Response;

    try {
      response = await fetch(url);
    } catch (err) {
      throw new FECNetworkError((err as Error).message);
    }

    if (!response.ok) {
      throw new FECError(`FEC API error ${response.status}: ${response.statusText}`);
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new FECParseError('Response body is not valid JSON');
    }
  }
}
