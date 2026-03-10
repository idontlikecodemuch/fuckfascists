import { FECClient, FECError, FECNetworkError, FECParseError } from '../FECClient';
import { RateLimiter, FEC_DEFAULT_LIMITS } from '../rateLimit';
import { RateLimitError } from '../errors';

const mockFetch = jest.fn();
globalThis.fetch = mockFetch as typeof globalThis.fetch;

function makeClient(): FECClient {
  return new FECClient({ apiKey: 'test-key' });
}

function mockJson(body: unknown, ok = true) {
  return { ok, status: ok ? 200 : 500, statusText: ok ? 'OK' : 'Server Error', json: async () => body };
}

describe('FECClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Constructor ─────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('initializes in anonymous mode when no API key is available', () => {
      const original = process.env['FEC_API_KEY'];
      delete process.env['FEC_API_KEY'];
      expect(() => new FECClient()).not.toThrow();
      if (original !== undefined) process.env['FEC_API_KEY'] = original;
    });

    it('accepts api key from process.env.FEC_API_KEY', () => {
      process.env['FEC_API_KEY'] = 'env-key';
      expect(() => new FECClient()).not.toThrow();
      delete process.env['FEC_API_KEY'];
    });

    it('prefers explicit apiKey over process.env', () => {
      process.env['FEC_API_KEY'] = 'env-key';
      expect(() => new FECClient({ apiKey: 'config-key' })).not.toThrow();
      delete process.env['FEC_API_KEY'];
    });
  });

  // ── searchCommittees ────────────────────────────────────────────────────────

  describe('searchCommittees', () => {
    it('returns mapped orgid/orgname pairs', async () => {
      mockFetch.mockResolvedValueOnce(mockJson({
        results: [
          { committee_id: 'C001', name: 'Test Corp PAC' },
          { committee_id: 'C002', name: 'Another Fund' },
        ],
      }));

      const result = await makeClient().searchCommittees('Test Corp');

      expect(result).toEqual([
        { orgid: 'C001', orgname: 'Test Corp PAC' },
        { orgid: 'C002', orgname: 'Another Fund' },
      ]);
    });

    it('returns empty array when results is empty', async () => {
      mockFetch.mockResolvedValueOnce(mockJson({ results: [] }));

      const result = await makeClient().searchCommittees('Unknown Corp');

      expect(result).toEqual([]);
    });

    it('throws FECNetworkError on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('connection refused'));

      await expect(makeClient().searchCommittees('test')).rejects.toThrow(FECNetworkError);
    });

    it('throws FECError on non-200 HTTP status', async () => {
      mockFetch.mockResolvedValueOnce(mockJson({}, false));

      await expect(makeClient().searchCommittees('test')).rejects.toThrow(FECError);
    });

    it('fetchOrgs is an alias for searchCommittees', async () => {
      mockFetch.mockResolvedValueOnce(mockJson({ results: [{ committee_id: 'C001', name: 'Acme' }] }));

      const result = await makeClient().fetchOrgs('Acme');

      expect(result).toEqual([{ orgid: 'C001', orgname: 'Acme' }]);
    });
  });

  // ── getCommitteeTotals ──────────────────────────────────────────────────────

  describe('getCommitteeTotals', () => {
    /**
     * Mocks three sequential fetches:
     *   1. committee details (name)
     *   2. /totals/ (activeCycles / recentCycle only — receipts values are ignored)
     *   3. /schedules/schedule_b/ (candidate contributions — source of party attribution)
     *
     * cycleRows: sorted most-recent-first (API sorts by -cycle).
     * sbRecords: each has disbursement_amount, two_year_transaction_period, candidate_party_affiliation.
     */
    function mockAllCalls(
      cycleRows: Array<{ cycle: number }>,
      sbRecords: Array<{ amount: number; cycle: number; party: string }> = [],
    ) {
      mockFetch
        .mockResolvedValueOnce(mockJson({ results: [{ committee_id: 'C001', name: 'ACME PAC', party_full: '' }] }))
        .mockResolvedValueOnce(mockJson({ results: cycleRows.map((r) => ({ receipts: 0, ...r })) }))
        .mockResolvedValueOnce(mockJson({
          results: sbRecords.map((r) => ({
            disbursement_amount:          r.amount,
            two_year_transaction_period:  r.cycle,
            candidate_party_affiliation:  r.party,
          })),
          pagination: { last_indexes: null },
        }));
    }

    it('recentCycle is the cycle from the first (most recent) totals result', async () => {
      mockAllCalls([{ cycle: 2024 }, { cycle: 2022 }, { cycle: 2020 }]);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.recentCycle).toBe(2024);
    });

    it('recentRepubs sums REP Schedule B disbursements in the most recent cycle only', async () => {
      mockAllCalls(
        [{ cycle: 2024 }, { cycle: 2022 }],
        [
          { party: 'REP', amount: 1_000_000, cycle: 2024 },
          { party: 'REP', amount:   800_000, cycle: 2022 },
        ],
      );

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.recentRepubs).toBe(1_000_000);
      expect(result.recentDems).toBe(0);
    });

    it('recentDems sums DEM Schedule B disbursements in the most recent cycle only', async () => {
      mockAllCalls(
        [{ cycle: 2024 }, { cycle: 2022 }],
        [
          { party: 'DEM', amount: 500_000, cycle: 2024 },
          { party: 'DEM', amount: 400_000, cycle: 2022 },
        ],
      );

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.recentDems).toBe(500_000);
      expect(result.recentRepubs).toBe(0);
    });

    it('totalRepubs sums all REP Schedule B disbursements across cycles', async () => {
      mockAllCalls(
        [{ cycle: 2024 }, { cycle: 2022 }, { cycle: 2020 }],
        [
          { party: 'REP', amount: 1_000_000, cycle: 2024 },
          { party: 'REP', amount:   800_000, cycle: 2022 },
          { party: 'REP', amount:   600_000, cycle: 2020 },
        ],
      );

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.totalRepubs).toBe(2_400_000);
      expect(result.totalDems).toBe(0);
    });

    it('totalDems sums all DEM Schedule B disbursements across cycles', async () => {
      mockAllCalls(
        [{ cycle: 2024 }, { cycle: 2022 }],
        [
          { party: 'DEM', amount: 500_000, cycle: 2024 },
          { party: 'DEM', amount: 400_000, cycle: 2022 },
        ],
      );

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.totalDems).toBe(900_000);
      expect(result.totalRepubs).toBe(0);
    });

    it('activeCycles is sorted ascending', async () => {
      mockAllCalls([{ cycle: 2024 }, { cycle: 2022 }, { cycle: 2020 }, { cycle: 2018 }, { cycle: 2016 }]);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.activeCycles).toEqual([2016, 2018, 2020, 2022, 2024]);
    });

    it('activeCycles contains no cycle earlier than 2016', async () => {
      mockAllCalls([{ cycle: 2024 }, { cycle: 2016 }]);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.activeCycles.every((c) => c >= 2016)).toBe(true);
    });

    it('corporate SSF disbursements attributed by candidate party, not committee party', async () => {
      mockAllCalls(
        [{ cycle: 2024 }],
        [
          { party: 'REP', amount: 600_000, cycle: 2024 },
          { party: 'DEM', amount: 400_000, cycle: 2024 },
        ],
      );

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.totalRepubs).toBe(600_000);
      expect(result.totalDems).toBe(400_000);
      expect(result.recentRepubs).toBe(600_000);
      expect(result.recentDems).toBe(400_000);
      expect(result.raw).toHaveLength(0);
    });

    it('stores non-REP/DEM Schedule B disbursements as raw line items', async () => {
      mockAllCalls(
        [{ cycle: 2024 }],
        [{ party: 'IND', amount: 100_000, cycle: 2024 }],
      );

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.totalRepubs).toBe(0);
      expect(result.totalDems).toBe(0);
      expect(result.raw).toHaveLength(1);
      expect(result.raw[0]).toMatchObject({ amount: 100_000, cycle: 2024, isReceipt: false });
    });

    it('fecCommitteeUrl is the canonical FEC committee URL', async () => {
      mockAllCalls([{ cycle: 2024 }]);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.fecCommitteeUrl).toBe('https://www.fec.gov/data/committee/C001/');
    });

    it('throws FECParseError when totals results is empty', async () => {
      mockFetch
        .mockResolvedValueOnce(mockJson({ results: [{ committee_id: 'C001', name: 'ACME PAC', party_full: '' }] }))
        .mockResolvedValueOnce(mockJson({ results: [] }));

      await expect(makeClient().getCommitteeTotals('C001')).rejects.toThrow(FECParseError);
    });

    it('fetchOrgSummary is an alias for getCommitteeTotals', async () => {
      mockAllCalls(
        [{ cycle: 2022 }],
        [{ party: 'REP', amount: 200_000, cycle: 2022 }],
      );

      const result = await makeClient().fetchOrgSummary('C001');

      expect(result).not.toBeNull();
      expect(result!.recentCycle).toBe(2022);
      expect(result!.totalRepubs).toBe(200_000);
    });
  });

  // ── Rate limiting ───────────────────────────────────────────────────────────

  describe('rate limiting', () => {
    it('throws RateLimitError after maxRequests is exceeded', async () => {
      const rateLimiter = new RateLimiter({ maxRequests: 1, windowMs: 60_000 });
      const client = new FECClient({ apiKey: 'test-key', rateLimiter });

      mockFetch.mockResolvedValue(mockJson({ results: [] }));

      await client.searchCommittees('first'); // burns the one allowed request

      await expect(client.searchCommittees('second')).rejects.toThrow(RateLimitError);
      expect(mockFetch).toHaveBeenCalledTimes(1); // second call never reaches network
    });

    it('FEC_DEFAULT_LIMITS allows 1000 requests per hour', () => {
      expect(FEC_DEFAULT_LIMITS.maxRequests).toBe(1_000);
      expect(FEC_DEFAULT_LIMITS.windowMs).toBe(3_600_000);
    });
  });
});
