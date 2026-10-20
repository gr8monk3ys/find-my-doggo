import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Point the client at a throwaway SQLite file before the module is loaded.
const dir = mkdtempSync(path.join(tmpdir(), 'fmd-support-'));
process.env.DATABASE_URL = `file:${path.join(dir, 'test.db')}`;

const { getClient, ensureSchema, resetClientForTests } = await import('@/lib/db');
const { SUPPORT_EMAILS_PER_HOUR, forwardContact, resetSupportMailForTests, sendSupportEmail } = await import(
  '@/lib/support-mail'
);

const MESSAGE = {
  name: 'Sam Rivera',
  email: 'sam@example.com',
  subject: 'Question about takedowns',
  message: 'How do I remove a listing I posted last week?',
};

const NOTE = { subject: 'Hello', text: 'Body' };

function configureMailer() {
  process.env.RESEND_API_KEY = 're_test';
  process.env.NOTIFY_FROM_EMAIL = 'noreply@example.com';
  const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function sentBody(fetchMock: ReturnType<typeof vi.fn>, call = 0) {
  const [, init] = fetchMock.mock.calls[call] as unknown as [string, RequestInit];
  return JSON.parse(String(init.body));
}

beforeEach(async () => {
  delete process.env.RESEND_API_KEY;
  delete process.env.NOTIFY_FROM_EMAIL;
  delete process.env.SUPPORT_EMAIL;
  resetSupportMailForTests();
  await ensureSchema();
  await getClient().execute('DELETE FROM email_sends');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

afterAll(() => {
  resetClientForTests();
  rmSync(dir, { recursive: true, force: true });
});

describe('forwardContact', () => {
  it('addresses the support inbox and lets it reply to the sender', async () => {
    const fetchMock = configureMailer();
    expect(await forwardContact(MESSAGE)).toBe(true);
    const body = sentBody(fetchMock);
    expect(body).toMatchObject({
      to: 'support@lscaturchio.xyz',
      reply_to: 'sam@example.com',
      subject: 'Find My Doggo contact: Question about takedowns',
    });
    expect(body.text).toContain(MESSAGE.message);
  });

  it('follows SUPPORT_EMAIL when it is set', async () => {
    const fetchMock = configureMailer();
    process.env.SUPPORT_EMAIL = 'help@example.com';
    await forwardContact(MESSAGE);
    expect(sentBody(fetchMock).to).toBe('help@example.com');
  });

  it('reports false and records nothing when no mailer is configured', async () => {
    vi.spyOn(console, 'info').mockImplementation(() => {});
    expect(await forwardContact(MESSAGE)).toBe(false);
    expect((await getClient().execute('SELECT COUNT(*) AS n FROM email_sends')).rows[0].n).toBe(0);
  });
});

describe('sendSupportEmail cap', () => {
  it('counts attempts in the database and stops at the hourly cap', async () => {
    const fetchMock = configureMailer();
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    for (let i = 0; i < SUPPORT_EMAILS_PER_HOUR; i += 1) {
      expect(await sendSupportEmail(NOTE)).toBe(true);
    }
    expect(await sendSupportEmail(NOTE)).toBe(false);
    expect(await sendSupportEmail(NOTE)).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(SUPPORT_EMAILS_PER_HOUR);
    expect((await getClient().execute('SELECT COUNT(*) AS n FROM email_sends')).rows[0].n).toBe(
      SUPPORT_EMAILS_PER_HOUR,
    );
    // The cap is logged once, not on every refused send.
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('counts a rejected send as an attempt too', async () => {
    configureMailer();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 422 })));
    expect(await sendSupportEmail(NOTE)).toBe(false);
    expect((await getClient().execute('SELECT COUNT(*) AS n FROM email_sends')).rows[0].n).toBe(1);
  });

  it('ignores attempts older than an hour', async () => {
    const fetchMock = configureMailer();
    const stale = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    for (let i = 0; i < SUPPORT_EMAILS_PER_HOUR; i += 1) {
      await getClient().execute({
        sql: `INSERT INTO email_sends (id, kind, created_at) VALUES (?, 'support', ?)`,
        args: [`stale-${i}`, stale],
      });
    }
    expect(await sendSupportEmail(NOTE)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
