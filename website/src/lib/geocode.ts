export interface Coordinates {
  lat: number;
  lng: number;
}

const DEFAULT_URL = 'https://nominatim.openstreetmap.org/search';
const TIMEOUT_MS = 5000;

/** Override to point at a self-hosted Nominatim, which is what its usage policy
 *  recommends for anything beyond light traffic. */
function endpoint(): string {
  return process.env.GEOCODER_URL ?? DEFAULT_URL;
}

/**
 * Nominatim's usage policy requires an identifying User-Agent and permits about
 * one request per second, which is why report submission is rate limited. Set
 * GEOCODER_USER_AGENT to a real contact address before running this at volume.
 */
function userAgent(): string {
  return process.env.GEOCODER_USER_AGENT ?? 'find-my-doggo (https://github.com/gr8monk3ys/find-my-doggo)';
}

/**
 * Resolves a free-text address to coordinates. Returns null on any failure —
 * a report with no map pin is still a useful report, so geocoding must never
 * be the reason a submission is rejected.
 */
export async function geocode(address: string): Promise<Coordinates | null> {
  // Lets tests, CI, and offline development skip the outbound call entirely
  // rather than leaning on Nominatim's rate limits.
  if (process.env.DISABLE_GEOCODING === '1') return null;

  const query = address.trim();
  if (!query) return null;

  const url = `${endpoint()}?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent(), Accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return parseGeocodeResponse(await response.json());
  } catch {
    return null;
  }
}

/** Split out from the fetch so it can be unit tested without a network call. */
export function parseGeocodeResponse(payload: unknown): Coordinates | null {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  const first = payload[0] as { lat?: unknown; lon?: unknown };
  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}
