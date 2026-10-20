interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/**
 * A fixed-window counter held in process memory. This is deliberately simple:
 * it stops a single client hammering the write endpoints during normal use, but
 * because serverless instances do not share memory it is NOT a defence against
 * a distributed flood. Front it with a shared store (Vercel KV, Upstash) or a
 * platform WAF rule before relying on it in anger.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    pruneExpired(now);
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

function pruneExpired(now: number): void {
  if (buckets.size < 1000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Best-effort client identity. `x-real-ip` first: the platform (Vercel) sets
 * it from the connection and a client cannot override it. Otherwise the LAST
 * hop of `x-forwarded-for`: proxies append the address they saw, so the last
 * value is the one the platform wrote, while the first is whatever the client
 * sent in its own header and can be rotated freely to dodge the limit. Falls
 * back to one shared bucket when neither header is present.
 */
export function clientKey(request: Request): string {
  const real = request.headers.get('x-real-ip')?.trim();
  if (real) return real;
  const hops = (request.headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((hop) => hop.trim())
    .filter(Boolean);
  return hops.at(-1) ?? 'unknown';
}

export function resetRateLimitsForTests(): void {
  buckets.clear();
}
