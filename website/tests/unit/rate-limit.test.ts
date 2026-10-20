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
  it('prefers x-real-ip, which the platform sets, over anything in x-forwarded-for', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': 'a, b, c', 'x-real-ip': '198.51.100.4' },
    });
    expect(clientKey(request)).toBe('198.51.100.4');
  });

  it('uses the LAST hop of x-forwarded-for, the one the proxy appended', () => {
    const request = new Request('https://example.com', {
      headers: { 'x-forwarded-for': 'a, b, c' },
    });
    expect(clientKey(request)).toBe('c');
    expect(clientKey(new Request('https://e.com', { headers: { 'x-forwarded-for': ' 203.0.113.7 , 10.0.0.1 ' } }))).toBe(
      '10.0.0.1',
    );
  });

  it('falls back to a shared bucket with neither header', () => {
    expect(clientKey(new Request('https://e.com'))).toBe('unknown');
    expect(clientKey(new Request('https://e.com', { headers: { 'x-forwarded-for': ' , ' } }))).toBe('unknown');
  });

  it('cannot be evaded by rotating the client-supplied first hop', () => {
    resetRateLimitsForTests();
    const keyFor = (i: number) =>
      clientKey(new Request('https://e.com', { headers: { 'x-forwarded-for': `10.0.0.${i}, 203.0.113.7` } }));
    for (let i = 0; i < 3; i += 1) {
      expect(checkRateLimit(keyFor(i), 3, 60_000).ok).toBe(true);
    }
    expect(checkRateLimit(keyFor(99), 3, 60_000).ok).toBe(false);
  });
});
