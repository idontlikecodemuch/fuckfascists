import type { DonationSummary } from '../models';
import type { OpenSecretsOrg } from '../matching/types';
import type { GetOrgsResponse, GetOrgSummaryResponse } from './types';
import { RateLimiter } from './rateLimit';
import { ApiError, OpenSecretsError, ParseError } from './errors';

const BASE_URL = 'https://www.opensecrets.org/api/';

export interface OpenSecretsClientConfig {
  apiKey: string;
  rateLimiter?: RateLimiter;
}

export class OpenSecretsClient {
  private readonly apiKey: string;
  private readonly rateLimiter: RateLimiter;

  constructor(config: OpenSecretsClientConfig) {
    this.apiKey = config.apiKey;
    this.rateLimiter = config.rateLimiter ?? new RateLimiter();
  }

  /**
   * Searches OpenSecrets for organizations matching `name`.
   * Satisfies MatchingDeps.fetchOrgs.
   */
  async getOrgs(name: string): Promise<OpenSecretsOrg[]> {
    const params = new URLSearchParams({
      method: 'getOrgs',
      org: name,
      apikey: this.apiKey,
      output: 'json',
    });

    const raw = await this.get<GetOrgsResponse>(params);
    const org = raw?.response?.organization;
    if (!org) return [];

    const entries = Array.isArray(org) ? org : [org];
    return entries.map((e) => ({
      orgid: e['@attributes'].orgid,
      orgname: e['@attributes'].orgname,
    }));
  }

  /**
   * Fetches donation summary for `orgId`, optionally for a specific `cycle` year.
   * Satisfies MatchingDeps.fetchOrgSummary.
   */
  async getOrgSummary(orgId: string, cycle?: string): Promise<DonationSummary> {
    const params = new URLSearchParams({
      method: 'orgSummary',
      id: orgId,
      apikey: this.apiKey,
      output: 'json',
      ...(cycle ? { cycle } : {}),
    });

    const raw = await this.get<GetOrgSummaryResponse>(params);
    const attrs = raw?.response?.organization?.['@attributes'];

    if (!attrs) {
      throw new ParseError(`No organization data in orgSummary response for ${orgId}`);
    }

    return {
      orgName: attrs.org_name,
      orgId: attrs.orgid,
      total: parseFloat(attrs.total) || 0,
      dems: parseFloat(attrs.dems) || 0,
      repubs: parseFloat(attrs.repubs) || 0,
      lobbying: parseFloat(attrs.lobbying) || 0,
      sourceUrl: attrs.source,
      cycle: attrs.cycle,
    };
  }

  private async get<T>(params: URLSearchParams): Promise<T> {
    this.rateLimiter.throttle();

    const url = `${BASE_URL}?${params.toString()}`;
    let response: Response;

    try {
      response = await fetch(url);
    } catch (err) {
      throw new OpenSecretsError(
        `Network error calling OpenSecrets API: ${(err as Error).message}`
      );
    }

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new ParseError('Response body is not valid JSON');
    }
  }
}
