// Primary: FEC client (OpenFEC API — as of v1.1)
export { FECClient, FECError, FECNetworkError, FECParseError, FEC_DEFAULT_LIMITS } from './FECClient';
export type { FECClientConfig } from './FECClient';

// Shared utilities
export { RateLimiter, OPENSECRETS_DEFAULT_LIMITS } from './rateLimit';
export type { RateLimiterConfig } from './rateLimit';
export { RateLimitError } from './errors';

// @deprecated — OpenSecretsClient will be removed once all callers migrate to FECClient.
export { OpenSecretsClient } from './OpenSecretsClient.legacy';
export type { OpenSecretsClientConfig } from './OpenSecretsClient.legacy';
export { OpenSecretsError, ApiError, ParseError } from './errors';
