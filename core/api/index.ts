// Primary: FEC client (OpenFEC API)
export { FECClient, FECError, FECNetworkError, FECParseError } from './FECClient';
export type { FECClientConfig } from './FECClient';

// Shared utilities
export { RateLimiter, FEC_DEFAULT_LIMITS } from './rateLimit';
export type { RateLimiterConfig } from './rateLimit';
export { RateLimitError, FECApiError, ApiError, ParseError } from './errors';
