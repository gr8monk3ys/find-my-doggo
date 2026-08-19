import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit, clientKey, resetRateLimitsForTests } from '@/lib/rate-limit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimitsForTests();
    vi.useFakeTimers();
  });
  afterEach(() => vi.useRealTimers());

  it('allows requests up to the limit and blocks the next one', () => {
    for (let i = 0; i < 3; i += 1) {
      expect(checkRateLimit('ip', 3, 60_000).ok).toBe(true);
    }
    const blocked = checkRateLimit('ip', 3, 60_000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('keeps separate counters per key', () => {
    expect(checkRateLimit('a', 1, 60_000).ok).toBe(true);
    expect(checkRateLimit('a', 1, 60_000).ok).toBe(false);
    expect(checkRateLimit('b', 1, 60_000).ok).toBe(true);
  });

  it('opens the window again once it expires', () => {
    expect(checkRateLimit('ip', 1, 1_000).ok).toBe(true);
    expect(checkRateLimit('ip', 1, 1_000).ok).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(checkRateLimit('ip', 1, 1_000).ok).toBe(true);
  });
});

describe('clientKey', () => {
  it('uses the first hop of x-forwarded-for', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
    });
    expect(clientKey(request)).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip, then to a shared bucket', () => {
    expect(clientKey(new Request('https://e.com', { headers: { 'x-real-ip': '198.51.100.4' } }))).toBe('198.51.100.4');
    expect(clientKey(new Request('https://e.com'))).toBe('unknown');
  });
});
