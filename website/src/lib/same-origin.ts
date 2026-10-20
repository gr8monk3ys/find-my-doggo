/**
 * A cheap CSRF guard for a mutating route on an app with no sessions: refuse a
 * request a browser has marked as cross-site, or one whose Origin names a
 * different host from the one that received it. Non-browser clients send
 * neither header and pass; they could not have been tricked by a page.
 *
 * Hosts are compared rather than full origins because a proxy in front of the
 * app (Vercel, a tunnel) can terminate TLS and hand Next an http URL while the
 * browser's Origin says https.
 */
export function isSameOrigin(request: Request): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false;

  const origin = request.headers.get('origin');
  if (!origin) return true;

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }

  const ownHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? new URL(request.url).host;
  return originHost.toLowerCase() === ownHost.split(',')[0].trim().toLowerCase();
}
