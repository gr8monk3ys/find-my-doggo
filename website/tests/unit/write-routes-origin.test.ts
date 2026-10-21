import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Point the client at a throwaway SQLite file before the module is loaded.
const dir = mkdtempSync(path.join(tmpdir(), 'fmd-origin-'));
process.env.DATABASE_URL = `file:${path.join(dir, 'test.db')}`;
process.env.DISABLE_GEOCODING = '1';
delete process.env.RESEND_API_KEY;
delete process.env.NOTIFY_FROM_EMAIL;

const { getClient, ensureSchema, resetClientForTests } = await import('@/lib/db');
const { resetRateLimitsForTests } = await import('@/lib/rate-limit');
const { resetSupportMailForTests } = await import('@/lib/support-mail');
const { isSameOrigin } = await import('@/lib/same-origin');
const { POST: postDog } = await import('@/app/api/dogs/route');
const { POST: postMessage } = await import('@/app/api/messages/route');

const ORIGIN = 'http://localhost:3103';
const BROWSER = { host: 'localhost:3103', origin: ORIGIN, 'sec-fetch-site': 'same-origin' };

const MESSAGE = {
  name: 'Sam Rivera',
  email: 'sam@example.com',
  subject: 'Is this listing still current?',
  message: 'I think I saw this dog near the park this morning.',
};

function message(headers: Record<string, string>) {
  return postMessage(
    new Request(`${ORIGIN}/api/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-real-ip': '203.0.113.20', ...headers },
      body: JSON.stringify(MESSAGE),
    }),
  );
}

function report(headers: Record<string, string>) {
  const form = new FormData();
  form.set('name', 'Biscuit');
  form.set('breed', 'Beagle');
  form.set('color', 'Tan and white');
  form.set('description', 'Friendly beagle with a red collar, last seen near the park.');
  form.set('status', 'lost');
  form.set('address', '1 Main St, Springfield');
  form.set('contactEmail', 'owner@example.com');
  return postDog(
    new Request(`${ORIGIN}/api/dogs`, {
      method: 'POST',
      headers: { 'x-real-ip': '203.0.113.21', ...headers },
      body: form,
    }),
  );
}

async function count(table: 'dogs' | 'messages') {
  return Number((await getClient().execute(`SELECT COUNT(*) AS n FROM ${table}`)).rows[0].n);
}

beforeEach(async () => {
  resetRateLimitsForTests();
  resetSupportMailForTests();
  vi.spyOn(console, 'info').mockImplementation(() => {});
  await ensureSchema();
  await getClient().execute('DELETE FROM messages');
  await getClient().execute('DELETE FROM dogs');
});

afterAll(() => {
  resetClientForTests();
  rmSync(dir, { recursive: true, force: true });
});

describe('isSameOrigin', () => {
  const req = (headers: Record<string, string>) => new Request(`${ORIGIN}/api/x`, { method: 'POST', headers });

  it('accepts a same-origin browser request and a client that sends neither header', () => {
    expect(isSameOrigin(req(BROWSER))).toBe(true);
    expect(isSameOrigin(req({}))).toBe(true);
  });

  it('refuses a request the browser marked cross-site, a foreign Origin, or a malformed one', () => {
    expect(isSameOrigin(req({ ...BROWSER, 'sec-fetch-site': 'cross-site' }))).toBe(false);
    expect(isSameOrigin(req({ ...BROWSER, origin: 'https://evil.example' }))).toBe(false);
    expect(isSameOrigin(req({ ...BROWSER, origin: 'not a url' }))).toBe(false);
  });

  it('compares hosts, not schemes, and prefers the first x-forwarded-host behind a proxy', () => {
    expect(isSameOrigin(req({ host: 'internal:3000', 'x-forwarded-host': 'doggo.example, internal', origin: 'https://doggo.example' }))).toBe(true);
    expect(isSameOrigin(req({ host: 'localhost:3103', origin: 'https://LOCALHOST:3103' }))).toBe(true);
  });
});

describe('POST /api/messages origin guard', () => {
  it('refuses a cross-site enquiry and stores nothing', async () => {
    expect((await message({ ...BROWSER, 'sec-fetch-site': 'cross-site' })).status).toBe(403);
    expect((await message({ ...BROWSER, origin: 'https://evil.example' })).status).toBe(403);
    expect(await count('messages')).toBe(0);
  });

  it('still accepts a same-origin browser request and a non-browser client', async () => {
    expect((await message(BROWSER)).status).toBe(201);
    expect((await message({})).status).toBe(201);
    expect(await count('messages')).toBe(2);
  });
});

describe('POST /api/dogs origin guard', () => {
  it('refuses a cross-site report and stores nothing', async () => {
    const refused = await report({ ...BROWSER, origin: 'https://evil.example' });
    expect(refused.status).toBe(403);
    expect(await refused.json()).toEqual({ error: 'Reports can only be submitted from this site.' });
    expect((await report({ ...BROWSER, 'sec-fetch-site': 'cross-site' })).status).toBe(403);
    expect(await count('dogs')).toBe(0);
  });

  it('still accepts a same-origin browser report', async () => {
    const created = await report(BROWSER);
    expect(created.status).toBe(201);
    expect(await count('dogs')).toBe(1);
  });
});
