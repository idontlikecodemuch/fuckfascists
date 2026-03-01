import { OpenSecretsClient } from '../client';
import { RateLimiter } from '../rateLimit';
import { ApiError, OpenSecretsError, ParseError, RateLimitError } from '../errors';

// ─── Fetch mock ───────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockOk(body: unknown): void {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(body),
  } as Response);
}

function mockHttpError(status: number, statusText: string): void {
  mockFetch.mockResolvedValueOnce({ ok: false, status, statusText } as Response);
}

function mockNetworkError(message = 'Failed to fetch'): void {
  mockFetch.mockRejectedValueOnce(new Error(message));
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeClient(apiKey = 'test-key'): OpenSecretsClient {
  return new OpenSecretsClient({
    apiKey,
    rateLimiter: new RateLimiter({ maxRequests: 100, windowMs: 60_000 }),
  });
}

const SINGLE_ORG_RESPONSE = {
  response: {
    organization: { '@attributes': { orgid: 'D000000074', orgname: 'Walmart Inc' } },
  },
};

const MULTI_ORG_RESPONSE = {
  response: {
    organization: [
      { '@attributes': { orgid: 'D000000074', orgname: 'Walmart Inc' } },
      { '@attributes': { orgid: 'D000000075', orgname: 'Walmart Foundation' } },
    ],
  },
};

const SUMMARY_RESPONSE = {
  response: {
    organization: {
      '@attributes': {
        org_name: 'Walmart Inc',
        orgid: 'D000000074',
        total: '5000000',
        dems: '1500000',
        repubs: '3000000',
        lobbying: '500000',
        source: 'https://www.opensecrets.org/orgs/summary?id=D000000074',
        cycle: '2024',
      },
    },
  },
};

// ─── getOrgs ──────────────────────────────────────────────────────────────────

describe('getOrgs', () => {
  beforeEach(() => mockFetch.mockReset());

  it('parses a multi-org response', async () => {
    mockOk(MULTI_ORG_RESPONSE);
    const orgs = await makeClient().getOrgs('walmart');
    expect(orgs).toHaveLength(2);
    expect(orgs[0]).toEqual({ orgid: 'D000000074', orgname: 'Walmart Inc' });
    expect(orgs[1]).toEqual({ orgid: 'D000000075', orgname: 'Walmart Foundation' });
  });

  it('wraps a single-org object result in an array', async () => {
    mockOk(SINGLE_ORG_RESPONSE);
    const orgs = await makeClient().getOrgs('walmart');
    expect(orgs).toHaveLength(1);
    expect(orgs[0].orgid).toBe('D000000074');
  });

  it('returns an empty array when organization key is absent', async () => {
    mockOk({ response: {} });
    const orgs = await makeClient().getOrgs('unknownco');
    expect(orgs).toEqual([]);
  });

  it('builds the correct request URL', async () => {
    mockOk(MULTI_ORG_RESPONSE);
    await makeClient('my-key').getOrgs('walmart inc');

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain('method=getOrgs');
    expect(url).toContain('apikey=my-key');
    expect(url).toContain('output=json');
    expect(url).toContain('org=walmart');
  });

  it('throws ApiError on a non-2xx HTTP response', async () => {
    mockHttpError(429, 'Too Many Requests');
    await expect(makeClient().getOrgs('walmart')).rejects.toThrow(ApiError);
  });

  it('throws OpenSecretsError on a network failure', async () => {
    mockNetworkError('Network request failed');
    await expect(makeClient().getOrgs('walmart')).rejects.toThrow(OpenSecretsError);
  });

  it('throws RateLimitError before hitting the network when exhausted', async () => {
    const client = new OpenSecretsClient({
      apiKey: 'test-key',
      rateLimiter: new RateLimiter({ maxRequests: 0, windowMs: 60_000 }),
    });
    await expect(client.getOrgs('walmart')).rejects.toThrow(RateLimitError);
    expect(mockFetch).not.toHaveBeenCalled();
  });
});

// ─── getOrgSummary ────────────────────────────────────────────────────────────

describe('getOrgSummary', () => {
  beforeEach(() => mockFetch.mockReset());

  it('parses a valid orgSummary response into DonationSummary', async () => {
    mockOk(SUMMARY_RESPONSE);
    const summary = await makeClient().getOrgSummary('D000000074');

    expect(summary).toEqual({
      orgName: 'Walmart Inc',
      orgId: 'D000000074',
      total: 5_000_000,
      dems: 1_500_000,
      repubs: 3_000_000,
      lobbying: 500_000,
      sourceUrl: 'https://www.opensecrets.org/orgs/summary?id=D000000074',
      cycle: '2024',
    });
  });

  it('includes the cycle param when provided', async () => {
    mockOk(SUMMARY_RESPONSE);
    await makeClient().getOrgSummary('D000000074', '2022');

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain('cycle=2022');
  });

  it('omits the cycle param when not provided', async () => {
    mockOk(SUMMARY_RESPONSE);
    await makeClient().getOrgSummary('D000000074');

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).not.toContain('cycle=');
  });

  it('includes orgId and apikey in request URL', async () => {
    mockOk(SUMMARY_RESPONSE);
    await makeClient('key-abc').getOrgSummary('D000000074');

    const url: string = mockFetch.mock.calls[0][0];
    expect(url).toContain('method=orgSummary');
    expect(url).toContain('id=D000000074');
    expect(url).toContain('apikey=key-abc');
  });

  it('defaults missing numeric fields to 0 instead of NaN', async () => {
    const response = JSON.parse(JSON.stringify(SUMMARY_RESPONSE));
    response.response.organization['@attributes'].lobbying = '';
    mockOk(response);

    const summary = await makeClient().getOrgSummary('D000000074');
    expect(summary.lobbying).toBe(0);
  });

  it('throws ParseError when organization data is absent', async () => {
    mockOk({ response: {} });
    await expect(makeClient().getOrgSummary('D000000074')).rejects.toThrow(ParseError);
  });

  it('throws ParseError when response body is not JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.reject(new SyntaxError('Unexpected token')),
    } as unknown as Response);
    await expect(makeClient().getOrgSummary('D000000074')).rejects.toThrow(ParseError);
  });

  it('throws ApiError on a non-2xx HTTP response', async () => {
    mockHttpError(500, 'Internal Server Error');
    await expect(makeClient().getOrgSummary('D000000074')).rejects.toThrow(ApiError);
  });

  it('throws OpenSecretsError on a network failure', async () => {
    mockNetworkError();
    await expect(makeClient().getOrgSummary('D000000074')).rejects.toThrow(
      OpenSecretsError
    );
  });
});
