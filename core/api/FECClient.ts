import type { DonationSummary, FECLineItem } from '../models';
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

interface FECScheduleBResult {
  line_number?: string;
  disbursement_amount?: number;
  two_year_transaction_period?: number;
  candidate_party_affiliation?: string;
  disbursement_description?: string;
}

interface FECScheduleBResponse {
  results: FECScheduleBResult[];
  pagination?: {
    last_indexes?: {
      last_index?: string;
      last_disbursement_date?: string;
    } | null;
    pages?: number;
    count?: number;
  };
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
   *
   * - activeCycles / recentCycle: from /committee/{id}/totals/ (aggregate activity)
   * - recentRepubs / recentDems / totalRepubs / totalDems: from /schedules/schedule_b/
   *   filtered to candidate recipients (recipient_type=P), attributed by
   *   candidate_party_affiliation (REP → repubs, DEM → dems, other → raw[])
   */
  async getCommitteeTotals(committeeId: string): Promise<DonationSummary> {
    const id = encodeURIComponent(committeeId);
    const cycleParams = CYCLES_SINCE_2016.map((c) => `cycle=${c}`).join('&');
    const keyParam = this.apiKey ? `&api_key=${encodeURIComponent(this.apiKey)}` : '';

    // Details + totals in parallel — totals used for activeCycles/recentCycle only.
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

    const totalsResults = totalsData.results;
    if (totalsResults.length === 0) {
      throw new FECParseError(`No totals data for committee ${committeeId}`);
    }

    // activeCycles and recentCycle from totals (API sorts by -cycle).
    const recentCycle = totalsResults[0]!.cycle ?? 0;
    const activeCycles: number[] = totalsResults
      .filter((r) => r.cycle != null)
      .map((r) => r.cycle!)
      .sort((a, b) => a - b);

    // Schedule B: actual candidate contributions — source of party attribution.
    const sbRecords = await this.fetchScheduleB(committeeId);

    let totalRepubs  = 0;
    let totalDems    = 0;
    let recentRepubs = 0;
    let recentDems   = 0;
    const rawMap = new Map<string, FECLineItem>();

    for (const rec of sbRecords) {
      const amount     = rec.disbursement_amount ?? 0;
      const cycle      = rec.two_year_transaction_period ?? 0;
      const party      = (rec.candidate_party_affiliation ?? '').toUpperCase();
      const lineNumber = rec.line_number ?? '';

      if (party === 'REP') {
        totalRepubs += amount;
        if (cycle === recentCycle) recentRepubs += amount;
      } else if (party === 'DEM') {
        totalDems += amount;
        if (cycle === recentCycle) recentDems += amount;
      } else if (amount > 0) {
        const key      = `${lineNumber}:${cycle}`;
        const existing = rawMap.get(key);
        if (existing) {
          existing.amount += amount;
        } else {
          rawMap.set(key, {
            lineNumber,
            description: rec.disbursement_description ?? '',
            amount,
            cycle,
            isReceipt:   false,
          });
        }
      }
    }

    const raw: FECLineItem[] = Array.from(rawMap.values());

    const today = new Date().toISOString().slice(0, 10);

    return {
      committeeId,
      committeeName:   detailsRow.name,
      recentCycle,
      recentRepubs,
      recentDems,
      totalRepubs,
      totalDems,
      activeCycles,
      raw,
      lastUpdated:     today,
      fecCommitteeUrl: makeFecCommitteeUrl(committeeId),
    };
  }

  /**
   * Paginates through /schedules/schedule_b/ for candidate contributions from
   * the given committee. Uses cursor-based pagination (last_index + last_disbursement_date).
   */
  private async fetchScheduleB(committeeId: string): Promise<FECScheduleBResult[]> {
    const id            = encodeURIComponent(committeeId);
    const sbCycleParams = CYCLES_SINCE_2016.map((c) => `two_year_transaction_period=${c}`).join('&');
    const keyParam      = this.apiKey ? `&api_key=${encodeURIComponent(this.apiKey)}` : '';

    const records: FECScheduleBResult[] = [];
    let cursor = '';

    while (true) {
      const data = await this.get<FECScheduleBResponse>(
        `/schedules/schedule_b/?committee_id=${id}&recipient_type=P&per_page=100&sort=-disbursement_date&${sbCycleParams}${keyParam}${cursor}`
      );
      const batch = data.results ?? [];
      records.push(...batch);

      const lastIndexes = data.pagination?.last_indexes;
      if (!lastIndexes?.last_index || batch.length < 100) break;

      const li = encodeURIComponent(lastIndexes.last_index);
      const ld = encodeURIComponent(lastIndexes.last_disbursement_date ?? '');
      cursor = `&last_index=${li}&last_disbursement_date=${ld}`;
    }

    return records;
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
