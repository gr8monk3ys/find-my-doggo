import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Point the client at a throwaway SQLite file before the module is loaded.
const dir = mkdtempSync(path.join(tmpdir(), 'fmd-feedback-'));
process.env.DATABASE_URL = `file:${path.join(dir, 'test.db')}`;
delete process.env.FEEDBACK_REVIEW_TOKEN;
delete process.env.RESEND_API_KEY;
delete process.env.NOTIFY_FROM_EMAIL;

const { getClient, ensureSchema, resetClientForTests } = await import('@/lib/db');
const { resetRateLimitsForTests } = await import('@/lib/rate-limit');
const { SUPPORT_EMAILS_PER_HOUR, resetSupportMailForTests } = await import('@/lib/support-mail');
const { GET, POST } = await import('@/app/api/feedback/route');
const { POST: postMessage } = await import('@/app/api/messages/route');

const ORIGIN = 'http://localhost:3103';
const VALID = { page: '/contact', message: 'The map did not load on my phone after I searched.' };

function post(body: unknown, headers: Record<string, string> = {}) {
  return POST(
    new Request(`${ORIGIN}/api/feedback`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        host: 'localhost:3103',
        origin: ORIGIN,
        'sec-fetch-site': 'same-origin',
        'x-real-ip': '203.0.113.9',
        'user-agent': 'vitest',
        ...headers,
      },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  );
}

function get(headers: Record<string, string> = {}) {
  return GET(new Request(`${ORIGIN}/api/feedback`, { headers }));
}

beforeEach(async () => {
  resetRateLimitsForTests();
  resetSupportMailForTests();
  await ensureSchema();
  await getClient().execute('DELETE FROM feedback');
  await getClient().execute('DELETE FROM messages');
  await getClient().execute('DELETE FROM email_sends');
});

afterEach(() => {
  delete process.env.FEEDBACK_REVIEW_TOKEN;
  delete process.env.RESEND_API_KEY;
  delete process.env.NOTIFY_FROM_EMAIL;
  vi.unstubAllGlobals();
});

afterAll(() => {
  resetClientForTests();
  rmSync(dir, { recursive: true, force: true });
});

describe('POST /api/feedback', () => {
  it('persists a note and reports that it was not emailed when no mailer is configured', async () => {
    const response = await post({ ...VALID, email: 'tester@example.com' });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ ok: true, delivered: false });

    const rows = await getClient().execute('SELECT page, message, email, user_agent, status, delivered FROM feedback');
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]).toMatchObject({
      page: '/contact',
      message: VALID.message,
      email: 'tester@example.com',
      user_agent: 'vitest',
      status: 'new',
      delivered: 0,
    });
  });

  it('stores an omitted or blank email as null', async () => {
    expect((await post({ ...VALID, email: '' })).status).toBe(201);
    const rows = await getClient().execute('SELECT email FROM feedback');
    expect(rows.rows[0].email).toBeNull();
  });

  it('rejects a short message, a bad email and a page that is not a path', async () => {
    const response = await post({ page: 'https://evil.example/', message: 'too short', email: 'nope' });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(Object.keys(body.fields).sort()).toEqual(['email', 'message', 'page']);
  });

  it('rejects a body that is not JSON', async () => {
    expect((await post('not json')).status).toBe(400);
  });

  it('refuses a cross-site request', async () => {
    expect((await post(VALID, { 'sec-fetch-site': 'cross-site' })).status).toBe(403);
    expect((await post(VALID, { origin: 'https://evil.example' })).status).toBe(403);
    expect((await getClient().execute('SELECT COUNT(*) AS n FROM feedback')).rows[0].n).toBe(0);
  });

  it('accepts a request with no Origin or Sec-Fetch-Site at all (a non-browser client)', async () => {
    const response = POST(
      new Request(`${ORIGIN}/api/feedback`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(VALID),
      }),
    );
    expect((await response).status).toBe(201);
  });

  it('rate limits the sixth note in an hour from one client', async () => {
    for (let i = 0; i < 5; i += 1) {
      expect((await post(VALID)).status).toBe(201);
    }
    const blocked = await post(VALID);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toMatch(/^\d+$/);
  });

  it('emails the support inbox and reports delivered when a mailer is configured', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.NOTIFY_FROM_EMAIL = 'noreply@example.com';
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const response = await post({ ...VALID, email: 'tester@example.com' });
    expect(await response.json()).toEqual({ ok: true, delivered: true });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    const sent = JSON.parse(String(init.body));
    expect(sent).toMatchObject({
      to: 'support@lscaturchio.xyz',
      reply_to: 'tester@example.com',
      subject: 'New beta feedback on /contact',
    });
    expect(sent.text).toContain(VALID.message);

    const rows = await getClient().execute('SELECT delivered FROM feedback');
    expect(rows.rows[0].delivered).toBe(1);
  });

  it('stops emailing feedback after its hourly cap, keeps storing, and still delivers contact mail', async () => {
    process.env.RESEND_API_KEY = 're_test';
    process.env.NOTIFY_FROM_EMAIL = 'noreply@example.com';
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Distinct clients, so the per-client limiter is not what stops this.
    for (let i = 0; i < SUPPORT_EMAILS_PER_HOUR; i += 1) {
      const response = await post(VALID, { 'x-real-ip': `203.0.113.${i + 10}` });
      expect(await response.json()).toEqual({ ok: true, delivered: true });
    }
    expect(fetchMock).toHaveBeenCalledTimes(SUPPORT_EMAILS_PER_HOUR);

    const capped = await post(VALID, { 'x-real-ip': '203.0.113.200' });
    expect(capped.status).toBe(201);
    expect(await capped.json()).toEqual({ ok: true, delivered: false });
    expect(fetchMock).toHaveBeenCalledTimes(SUPPORT_EMAILS_PER_HOUR);

    const rows = await getClient().execute('SELECT delivered FROM feedback ORDER BY rowid');
    expect(rows.rows).toHaveLength(SUPPORT_EMAILS_PER_HOUR + 1);
    expect(rows.rows.at(-1)?.delivered).toBe(0);
    expect(console.warn).toHaveBeenCalledTimes(1);

    // The contact form has its own bucket: a takedown request still reaches the inbox.
    const contact = await postMessage(
      new Request(`${ORIGIN}/api/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-real-ip': '203.0.113.201' },
        body: JSON.stringify({
          name: 'Sam Rivera',
          email: 'sam@example.com',
          subject: 'Please take down my listing',
          message: 'The dog is home; please remove the listing I posted last week.',
        }),
      }),
    );
    expect(await contact.json()).toEqual({ ok: true, delivered: true });
    expect(fetchMock).toHaveBeenCalledTimes(SUPPORT_EMAILS_PER_HOUR + 1);
    const messages = await getClient().execute('SELECT delivered FROM messages');
    expect(messages.rows[0].delivered).toBe(1);
  });

  it('leaves delivered = 0 on a contact message when no mailer is configured', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    const contact = await postMessage(
      new Request(`${ORIGIN}/api/messages`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-real-ip': '203.0.113.202' },
        body: JSON.stringify({
          name: 'Sam Rivera',
          email: 'sam@example.com',
          subject: 'Please take down my listing',
          message: 'The dog is home; please remove the listing I posted last week.',
        }),
      }),
    );
    expect(await contact.json()).toEqual({ ok: true, delivered: false });
    expect((await getClient().execute('SELECT delivered FROM messages')).rows[0].delivered).toBe(0);
  });
});

describe('GET /api/feedback', () => {
  it('does not exist for the public when no review token is configured', async () => {
    expect((await get({ authorization: 'Bearer anything' })).status).toBe(404);
  });

  it('rejects a missing or wrong token once one is configured', async () => {
    process.env.FEEDBACK_REVIEW_TOKEN = 'correct-horse';
    expect((await get()).status).toBe(401);
    expect((await get({ authorization: 'Bearer wrong-horse' })).status).toBe(401);
    // Same length, different bytes: the constant-time path, not the length shortcut.
    expect((await get({ authorization: 'Bearer correct-h0rse' })).status).toBe(401);
  });

  it('lists the newest notes first for the right token', async () => {
    process.env.FEEDBACK_REVIEW_TOKEN = 'correct-horse';
    await post({ ...VALID, message: 'First note, long enough to pass validation.' });
    await post({ ...VALID, page: '/map', message: 'Second note, long enough to pass validation.' });

    const response = await get({ authorization: 'Bearer correct-horse' });
    expect(response.status).toBe(200);
    const { feedback } = await response.json();
    expect(feedback).toHaveLength(2);
    expect(feedback[0]).toMatchObject({ page: '/map', status: 'new', email: null, delivered: false });
    expect(feedback[1].message).toMatch(/^First note/);
  });

  it('narrows to the notes that were never emailed with ?undelivered=1', async () => {
    process.env.FEEDBACK_REVIEW_TOKEN = 'correct-horse';
    process.env.RESEND_API_KEY = 're_test';
    process.env.NOTIFY_FROM_EMAIL = 'noreply@example.com';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    vi.spyOn(console, 'info').mockImplementation(() => {});

    await post({ ...VALID, message: 'Emailed note, long enough to pass validation.' });
    delete process.env.RESEND_API_KEY;
    await post({ ...VALID, page: '/map', message: 'Skipped note, long enough to pass validation.' }, { 'x-real-ip': '203.0.113.50' });

    const all = await (await get({ authorization: 'Bearer correct-horse' })).json();
    expect(all.feedback).toHaveLength(2);

    const response = await GET(
      new Request(`${ORIGIN}/api/feedback?undelivered=1`, { headers: { authorization: 'Bearer correct-horse' } }),
    );
    expect(response.status).toBe(200);
    const { feedback } = await response.json();
    expect(feedback).toHaveLength(1);
    expect(feedback[0]).toMatchObject({ page: '/map', delivered: false });
    expect(feedback[0].message).toMatch(/^Skipped note/);
  });
});
