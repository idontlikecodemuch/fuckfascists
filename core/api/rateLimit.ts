import { RateLimitError } from './errors';

export interface RateLimiterConfig {
  maxRequests: number; // requests allowed per window
  windowMs: number;    // sliding window length in milliseconds
}

// FEC API rate limit: 1,000 requests per hour with an API key.
export const FEC_DEFAULT_LIMITS: RateLimiterConfig = {
  maxRequests: 1_000,
  windowMs: 3_600_000, // 1 hour
};

/**
 * Sliding-window in-memory rate limiter.
 * One instance per FECClient; not persisted across app restarts.
 * For stricter enforcement, wire in the persistent counter from core/data (step 4).
 */
export class RateLimiter {
  private timestamps: number[] = [];

  constructor(private readonly config: RateLimiterConfig = FEC_DEFAULT_LIMITS) {}

  /** Requests remaining in the current window. */
  get remaining(): number {
    this.prune();
    return Math.max(0, this.config.maxRequests - this.timestamps.length);
  }

  /**
   * Records a request if within the limit.
   * Throws RateLimitError (without touching the network) if exhausted.
   */
  throttle(): void {
    this.prune();
    if (this.timestamps.length >= this.config.maxRequests) {
      throw new RateLimitError();
    }
    this.timestamps.push(Date.now());
  }

  private prune(): void {
    const windowStart = Date.now() - this.config.windowMs;
    this.timestamps = this.timestamps.filter((t) => t > windowStart);
  }
}
