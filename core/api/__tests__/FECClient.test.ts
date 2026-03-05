import {
  FECClient,
  FECError,
  FECNetworkError,
  FECParseError,
  FEC_DEFAULT_LIMITS,
} from '../FECClient';
import { RateLimiter } from '../rateLimit';
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
    it('throws FECError when no API key is available', () => {
      const original = process.env['FEC_API_KEY'];
      delete process.env['FEC_API_KEY'];
      expect(() => new FECClient()).toThrow(FECError);
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
     * Mock two parallel fetches: details + multi-cycle totals.
     * results array is sorted most-recent-first (the API sorts by -cycle).
     */
    function mockMultiCycleCalls(
      partyFull: string,
      cycleRows: Array<{ receipts: number; cycle: number }>,
    ) {
      mockFetch
        .mockResolvedValueOnce(mockJson({ committee_id: 'C001', name: 'ACME PAC', party_full: partyFull }))
        .mockResolvedValueOnce(mockJson({ results: cycleRows }));
    }

    it('recentCycle is the cycle from the first (most recent) result', async () => {
      mockMultiCycleCalls('REPUBLICAN PARTY', [
        { receipts: 1_000_000, cycle: 2024 },
        { receipts: 800_000,  cycle: 2022 },
        { receipts: 600_000,  cycle: 2020 },
      ]);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.recentCycle).toBe(2024);
    });

    it('recentRepubs matches the first result only for a Republican committee', async () => {
      mockMultiCycleCalls('REPUBLICAN PARTY OF TEXAS', [
        { receipts: 1_000_000, cycle: 2024 },
        { receipts: 800_000,  cycle: 2022 },
      ]);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.recentRepubs).toBe(1_000_000);
      expect(result.recentDems).toBe(0);
    });

    it('recentDems matches the first result only for a Democratic committee', async () => {
      mockMultiCycleCalls('DEMOCRATIC PARTY', [
        { receipts: 500_000, cycle: 2024 },
        { receipts: 400_000, cycle: 2022 },
      ]);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.recentDems).toBe(500_000);
      expect(result.recentRepubs).toBe(0);
    });

    it('totalRepubs sums all results for a Republican committee', async () => {
      mockMultiCycleCalls('REPUBLICAN PARTY OF TEXAS', [
        { receipts: 1_000_000, cycle: 2024 },
        { receipts: 800_000,  cycle: 2022 },
        { receipts: 600_000,  cycle: 2020 },
      ]);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.totalRepubs).toBe(2_400_000);
      expect(result.totalDems).toBe(0);
    });

    it('totalDems sums all results for a Democratic committee', async () => {
      mockMultiCycleCalls('DEMOCRATIC PARTY', [
        { receipts: 500_000, cycle: 2024 },
        { receipts: 400_000, cycle: 2022 },
      ]);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.totalDems).toBe(900_000);
      expect(result.totalRepubs).toBe(0);
    });

    it('activeCycles is sorted ascending', async () => {
      mockMultiCycleCalls('REPUBLICAN PARTY', [
        { receipts: 1_000_000, cycle: 2024 },
        { receipts: 800_000,  cycle: 2022 },
        { receipts: 600_000,  cycle: 2020 },
        { receipts: 400_000,  cycle: 2018 },
        { receipts: 200_000,  cycle: 2016 },
      ]);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.activeCycles).toEqual([2016, 2018, 2020, 2022, 2024]);
    });

    it('activeCycles contains no cycle earlier than 2016', async () => {
      mockMultiCycleCalls('REPUBLICAN PARTY', [
        { receipts: 500_000, cycle: 2024 },
        { receipts: 400_000, cycle: 2016 },
      ]);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.activeCycles.every((c) => c >= 2016)).toBe(true);
    });

    it('sets totalRepubs and totalDems to 0 for unknown party', async () => {
      mockMultiCycleCalls('GREEN PARTY', [
        { receipts: 100_000, cycle: 2024 },
      ]);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.totalRepubs).toBe(0);
      expect(result.totalDems).toBe(0);
    });

    it('fecCommitteeUrl is the canonical FEC committee URL', async () => {
      mockMultiCycleCalls('REPUBLICAN PARTY', [{ receipts: 500_000, cycle: 2024 }]);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.fecCommitteeUrl).toBe('https://www.fec.gov/data/committee/C001/');
    });

    it('throws FECParseError when totals results is empty', async () => {
      mockFetch
        .mockResolvedValueOnce(mockJson({ committee_id: 'C001', name: 'ACME PAC', party_full: 'REPUBLICAN' }))
        .mockResolvedValueOnce(mockJson({ results: [] }));

      await expect(makeClient().getCommitteeTotals('C001')).rejects.toThrow(FECParseError);
    });

    it('fetchOrgSummary is an alias for getCommitteeTotals', async () => {
      mockMultiCycleCalls('REPUBLICAN PARTY', [{ receipts: 200_000, cycle: 2022 }]);

      const result = await makeClient().fetchOrgSummary('C001');

      expect(result.recentCycle).toBe(2022);
      expect(result.totalRepubs).toBe(200_000);
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
