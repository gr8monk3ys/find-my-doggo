import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { forwardEnquiry, sendEmail } from '@/lib/notify';

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
    const message = {
      name: 'Sam Rivera',
      email: 'sam@example.com',
      subject: 'Seen near the park',
      message: 'I think I saw this husky near the park entrance.',
      dogId: DOG.id,
    };
    expect(await forwardEnquiry(DOG, message)).toBe(true);
    expect(sentBody(fetchMock)).toMatchObject({ to: 'owner@example.com', reply_to: 'sam@example.com' });
  });
});
