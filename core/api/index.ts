// Primary: FEC client (OpenFEC API — as of v1.1)
export { FECClient, FECError, FECNetworkError, FECParseError, FEC_DEFAULT_LIMITS } from './FECClient';
export type { FECClientConfig } from './FECClient';

// Shared utilities
export { RateLimiter, OPENSECRETS_DEFAULT_LIMITS } from './rateLimit';
export type { RateLimiterConfig } from './rateLimit';
export { RateLimitError } from './errors';

// Legacy error classes kept for any external code that may catch them.
export { OpenSecretsError, ApiError, ParseError } from './errors';
