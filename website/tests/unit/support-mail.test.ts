import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Point the client at a throwaway SQLite file before the module is loaded.
const dir = mkdtempSync(path.join(tmpdir(), 'fmd-support-'));
process.env.DATABASE_URL = `file:${path.join(dir, 'test.db')}`;

const { getClient, ensureSchema, resetClientForTests } = await import('@/lib/db');
const { SUPPORT_EMAILS_PER_HOUR, forwardContact, resetSupportMailForTests, sendSupportEmail, supportMailStats } =
  await import('@/lib/support-mail');

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

async function countKind(kind: string): Promise<number> {
  const { rows } = await getClient().execute({ sql: 'SELECT COUNT(*) AS n FROM email_sends WHERE kind = ?', args: [kind] });
  return Number(rows[0].n);
}

async function fillWindow(kind: 'contact' | 'feedback') {
  for (let i = 0; i < SUPPORT_EMAILS_PER_HOUR; i += 1) {
    expect(await sendSupportEmail(kind, NOTE)).toBe(true);
  }
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
    expect(await countKind('contact')).toBe(1);
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
    expect(await countKind('contact')).toBe(0);
  });
});

describe('sendSupportEmail cap', () => {
  it('stops at the hourly cap for one flow and logs once', async () => {
    const fetchMock = configureMailer();
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await fillWindow('feedback');
    expect(await sendSupportEmail('feedback', NOTE)).toBe(false);
    expect(await sendSupportEmail('feedback', NOTE)).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(SUPPORT_EMAILS_PER_HOUR);
    expect(await countKind('feedback')).toBe(SUPPORT_EMAILS_PER_HOUR);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('keeps contact mail flowing while feedback is capped, and vice versa', async () => {
    const fetchMock = configureMailer();
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    await fillWindow('feedback');
    expect(await sendSupportEmail('feedback', NOTE)).toBe(false);
    expect(await forwardContact(MESSAGE)).toBe(true);
    expect(sentBody(fetchMock, SUPPORT_EMAILS_PER_HOUR).subject).toMatch(/^Find My Doggo contact:/);

    await getClient().execute('DELETE FROM email_sends');
    await fillWindow('contact');
    expect(await sendSupportEmail('contact', NOTE)).toBe(false);
    expect(await sendSupportEmail('feedback', NOTE)).toBe(true);
  });

  it('reserves slots atomically: of 30 concurrent sends exactly the cap go through', async () => {
    const fetchMock = configureMailer();
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const results = await Promise.all(Array.from({ length: 30 }, () => sendSupportEmail('feedback', NOTE)));
    expect(results.filter(Boolean)).toHaveLength(SUPPORT_EMAILS_PER_HOUR);
    expect(fetchMock).toHaveBeenCalledTimes(SUPPORT_EMAILS_PER_HOUR);
    expect(await countKind('feedback')).toBe(SUPPORT_EMAILS_PER_HOUR);
    // The other flow is untouched.
    expect(await countKind('contact')).toBe(0);
    expect(await sendSupportEmail('contact', NOTE)).toBe(true);
  });

  it('releases the reservation when the mailer fails, so a transient error does not burn a slot', async () => {
    configureMailer();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 422 })));
    expect(await sendSupportEmail('contact', NOTE)).toBe(false);
    expect(await countKind('contact')).toBe(0);
  });

  it('ignores attempts older than an hour', async () => {
    const fetchMock = configureMailer();
    const stale = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    for (let i = 0; i < SUPPORT_EMAILS_PER_HOUR; i += 1) {
      await getClient().execute({
        sql: `INSERT INTO email_sends (id, kind, created_at) VALUES (?, 'feedback', ?)`,
        args: [`stale-${i}`, stale],
      });
    }
    expect(await sendSupportEmail('feedback', NOTE)).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('supportMailStats', () => {
  it('reports each flow separately and flags a full window', async () => {
    configureMailer();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(await supportMailStats()).toEqual({
      contact: { sentLastHour: 0, capPerHour: SUPPORT_EMAILS_PER_HOUR, capped: false },
      feedback: { sentLastHour: 0, capPerHour: SUPPORT_EMAILS_PER_HOUR, capped: false },
    });

    await sendSupportEmail('contact', NOTE);
    await fillWindow('feedback');
    const stats = await supportMailStats();
    expect(stats.contact).toEqual({ sentLastHour: 1, capPerHour: SUPPORT_EMAILS_PER_HOUR, capped: false });
    expect(stats.feedback).toEqual({
      sentLastHour: SUPPORT_EMAILS_PER_HOUR,
      capPerHour: SUPPORT_EMAILS_PER_HOUR,
      capped: true,
    });
  });
});
