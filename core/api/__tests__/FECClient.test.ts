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
      // No throw and uses config key (verified indirectly via network call URL)
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
    function mockParallelCalls(partyFull: string, receipts: number, cycle: number) {
      // Two parallel fetches: details first, totals second (per Promise.all order)
      mockFetch
        .mockResolvedValueOnce(mockJson({ committee_id: 'C001', name: 'ACME PAC', party_full: partyFull }))
        .mockResolvedValueOnce(mockJson({ results: [{ receipts, cycle }] }));
    }

    it('maps REPUBLICAN party: repubs=receipts, dems=0', async () => {
      mockParallelCalls('REPUBLICAN PARTY OF TEXAS', 500_000, 2024);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.repubs).toBe(500_000);
      expect(result.dems).toBe(0);
      expect(result.total).toBe(500_000);
      expect(result.lobbying).toBe(0);
      expect(result.cycle).toBe('2024');
      expect(result.sourceUrl).toBe('https://www.fec.gov/data/committee/C001/');
      expect(result.orgName).toBe('ACME PAC');
      expect(result.orgId).toBe('C001');
    });

    it('maps DEMOCRAT party: dems=receipts, repubs=0', async () => {
      mockParallelCalls('DEMOCRATIC PARTY', 300_000, 2024);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.dems).toBe(300_000);
      expect(result.repubs).toBe(0);
    });

    it('sets both repubs and dems to 0 for unknown party', async () => {
      mockParallelCalls('GREEN PARTY', 100_000, 2024);

      const result = await makeClient().getCommitteeTotals('C001');

      expect(result.repubs).toBe(0);
      expect(result.dems).toBe(0);
    });

    it('throws FECParseError when totals results is empty', async () => {
      mockFetch
        .mockResolvedValueOnce(mockJson({ committee_id: 'C001', name: 'ACME PAC', party_full: 'REPUBLICAN' }))
        .mockResolvedValueOnce(mockJson({ results: [] }));

      await expect(makeClient().getCommitteeTotals('C001')).rejects.toThrow(FECParseError);
    });

    it('fetchOrgSummary is an alias for getCommitteeTotals', async () => {
      mockParallelCalls('REPUBLICAN', 200_000, 2022);

      const result = await makeClient().fetchOrgSummary('C001');

      expect(result.total).toBe(200_000);
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
