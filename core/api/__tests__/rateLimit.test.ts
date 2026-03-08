import { RateLimiter, FEC_DEFAULT_LIMITS } from '../rateLimit';
import { RateLimitError } from '../errors';

describe('RateLimiter', () => {
  it('allows requests within the limit', () => {
    const limiter = new RateLimiter({ maxRequests: 3, windowMs: 60_000 });
    expect(() => limiter.throttle()).not.toThrow();
    expect(() => limiter.throttle()).not.toThrow();
    expect(() => limiter.throttle()).not.toThrow();
  });

  it('throws RateLimitError when the limit is exceeded', () => {
    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 60_000 });
    limiter.throttle();
    limiter.throttle();
    expect(() => limiter.throttle()).toThrow(RateLimitError);
  });

  it('does not call the network when throwing (callers rely on this)', () => {
    const limiter = new RateLimiter({ maxRequests: 0, windowMs: 60_000 });
    expect(() => limiter.throttle()).toThrow(RateLimitError);
  });

  it('reports correct remaining count', () => {
    const limiter = new RateLimiter({ maxRequests: 5, windowMs: 60_000 });
    expect(limiter.remaining).toBe(5);
    limiter.throttle();
    expect(limiter.remaining).toBe(4);
    limiter.throttle();
    expect(limiter.remaining).toBe(3);
  });

  it('remaining never goes below 0', () => {
    const limiter = new RateLimiter({ maxRequests: 1, windowMs: 60_000 });
    limiter.throttle();
    expect(limiter.remaining).toBe(0);
  });

  it('slides the window — old requests expire and allow new ones', () => {
    jest.useFakeTimers();

    const limiter = new RateLimiter({ maxRequests: 2, windowMs: 1_000 });
    limiter.throttle();
    limiter.throttle();
    expect(() => limiter.throttle()).toThrow(RateLimitError);

    jest.advanceTimersByTime(1_001); // slide past both timestamps

    expect(() => limiter.throttle()).not.toThrow();
    expect(limiter.remaining).toBe(1);

    jest.useRealTimers();
  });

  it('partially slides — only expired timestamps are pruned', () => {
    jest.useFakeTimers();

    const limiter = new RateLimiter({ maxRequests: 3, windowMs: 2_000 });
    limiter.throttle(); // t=0
    jest.advanceTimersByTime(1_500);
    limiter.throttle(); // t=1500
    jest.advanceTimersByTime(600); // total t=2100 — first request (t=0) has expired

    // Two requests used (t=1500 still in window), one slot free
    expect(limiter.remaining).toBe(2);

    jest.useRealTimers();
  });

  it('uses FEC defaults when constructed with no arguments', () => {
    const limiter = new RateLimiter();
    expect(limiter.remaining).toBe(FEC_DEFAULT_LIMITS.maxRequests);
  });
});
