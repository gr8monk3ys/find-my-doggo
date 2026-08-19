import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { geocode } from '@/lib/geocode';

/** Stands in for Nominatim so the fetch path is covered without a network call. */
let server: Server;
let respond: (req: { url: string; userAgent?: string }) => { status: number; body: string };
let lastRequest: { url: string; userAgent?: string } | undefined;

beforeAll(async () => {
  server = createServer((req, res) => {
    lastRequest = { url: req.url ?? '', userAgent: req.headers['user-agent'] };
    const { status, body } = respond(lastRequest);
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(body);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  process.env.GEOCODER_URL = `http://127.0.0.1:${port}/search`;
  process.env.GEOCODER_USER_AGENT = 'find-my-doggo-tests';
  delete process.env.DISABLE_GEOCODING;
});

afterAll(async () => {
  delete process.env.GEOCODER_URL;
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  lastRequest = undefined;
  respond = () => ({ status: 200, body: '[]' });
});

describe('geocode', () => {
  it('resolves an address to coordinates', async () => {
    respond = () => ({ status: 200, body: JSON.stringify([{ lat: '51.4545', lon: '-2.5879' }]) });
    expect(await geocode('Bristol')).toEqual({ lat: 51.4545, lng: -2.5879 });
  });

  it('sends the identifying User-Agent Nominatim requires', async () => {
    respond = () => ({ status: 200, body: JSON.stringify([{ lat: '0', lon: '0' }]) });
    await geocode('Bristol');
    expect(lastRequest?.userAgent).toBe('find-my-doggo-tests');
  });

  it('url-encodes the query rather than pasting it in raw', async () => {
    respond = () => ({ status: 200, body: '[]' });
    await geocode('Bristol & Bath, UK');
    expect(lastRequest?.url).toContain('q=Bristol%20%26%20Bath%2C%20UK');
  });

  it('returns null when the geocoder errors, so a report is never blocked', async () => {
    respond = () => ({ status: 429, body: 'rate limited' });
    expect(await geocode('Bristol')).toBeNull();
  });

  it('returns null for an unparseable body', async () => {
    respond = () => ({ status: 200, body: 'not json' });
    expect(await geocode('Bristol')).toBeNull();
  });

  it('returns null for a blank address without calling out at all', async () => {
    expect(await geocode('   ')).toBeNull();
    expect(lastRequest).toBeUndefined();
  });

  it('skips the call entirely when geocoding is disabled', async () => {
    process.env.DISABLE_GEOCODING = '1';
    expect(await geocode('Bristol')).toBeNull();
    expect(lastRequest).toBeUndefined();
    delete process.env.DISABLE_GEOCODING;
  });
});
