import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forwardContact, forwardEnquiry, sendEmail } from '@/lib/notify';

const MESSAGE = {
  name: 'Sam Rivera',
  email: 'sam@example.com',
  subject: 'Question about takedowns',
  message: 'How do I remove a listing I posted last week?',
};

const DOG = {
  id: 'dog-1',
  name: 'Luna',
  breed: 'Husky',
  color: 'Grey and white',
  description: 'Blue eyes, red collar.',
  status: 'lost' as const,
  imageUrl: null,
  location: { address: 'Seattle, Washington', lat: 47.6, lng: -122.3 },
  dateReported: '2026-10-01T00:00:00.000Z',
  contactEmail: 'owner@example.com',
  contactPhone: null,
};

beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.NOTIFY_FROM_EMAIL;
  delete process.env.SUPPORT_EMAIL;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function configureMailer() {
  process.env.RESEND_API_KEY = 're_test';
  process.env.NOTIFY_FROM_EMAIL = 'noreply@example.com';
  const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function sentBody(fetchMock: ReturnType<typeof vi.fn>) {
  const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  return JSON.parse(String(init.body));
}

describe('sendEmail', () => {
  it('returns false and sends nothing without a mailer configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'info').mockImplementation(() => {});

    expect(await sendEmail({ to: 'a@example.com', subject: 'Hello', text: 'Body' })).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts to Resend with the configured from address and reports success', async () => {
    const fetchMock = configureMailer();
    expect(await sendEmail({ to: 'a@example.com', replyTo: 'b@example.com', subject: 'Hello', text: 'Body' })).toBe(
      true,
    );
    expect(sentBody(fetchMock)).toEqual({
      from: 'noreply@example.com',
      to: 'a@example.com',
      reply_to: 'b@example.com',
      subject: 'Hello',
      text: 'Body',
    });
  });

  it('reports false when Resend rejects the message or the network fails', async () => {
    configureMailer();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 422 })));
    expect(await sendEmail({ to: 'a@example.com', subject: 'Hello', text: 'Body' })).toBe(false);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    expect(await sendEmail({ to: 'a@example.com', subject: 'Hello', text: 'Body' })).toBe(false);
  });
});

describe('forwardEnquiry', () => {
  it('addresses the reporter and lets them reply to the sender', async () => {
    const fetchMock = configureMailer();
    expect(await forwardEnquiry(DOG, { ...MESSAGE, dogId: DOG.id })).toBe(true);
    expect(sentBody(fetchMock)).toMatchObject({ to: 'owner@example.com', reply_to: 'sam@example.com' });
  });
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
});
