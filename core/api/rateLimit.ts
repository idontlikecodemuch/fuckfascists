import { RateLimitError } from './errors';

export interface RateLimiterConfig {
  maxRequests: number; // requests allowed per window
  windowMs: number;    // sliding window length in milliseconds
}

// OpenSecrets free-tier limit: 200 requests per day.
export const OPENSECRETS_DEFAULT_LIMITS: RateLimiterConfig = {
  maxRequests: 200,
  windowMs: 24 * 60 * 60 * 1_000,
};

/**
 * Sliding-window in-memory rate limiter.
 * One instance per OpenSecretsClient; not persisted across app restarts.
 * For stricter enforcement, wire in the persistent counter from core/data (step 4).
 */
export class RateLimiter {
  private timestamps: number[] = [];

  constructor(private readonly config: RateLimiterConfig = OPENSECRETS_DEFAULT_LIMITS) {}

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
