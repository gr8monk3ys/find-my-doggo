import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BETA, betaLabel, features, supportEmail } from '@/lib/features';

const KEYS = [
  'DATABASE_URL',
  'BLOB_READ_WRITE_TOKEN',
  'RESEND_API_KEY',
  'NOTIFY_FROM_EMAIL',
  'DISABLE_GEOCODING',
  'FEEDBACK_REVIEW_TOKEN',
  'SUPPORT_EMAIL',
] as const;

const saved: Partial<Record<(typeof KEYS)[number], string | undefined>> = {};

beforeEach(() => {
  for (const key of KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('features', () => {
  it('reports nothing configured on a bare environment, except geocoding', () => {
    expect(features()).toEqual({
      hostedDatabase: false,
      durableImageStorage: false,
      emailDelivery: false,
      geocoding: true,
      feedbackReview: false,
    });
  });

  it('treats a file: DATABASE_URL as local, anything else as hosted', () => {
    process.env.DATABASE_URL = 'file:./data/dev.db';
    expect(features().hostedDatabase).toBe(false);
    process.env.DATABASE_URL = 'libsql://find-my-doggo.turso.io';
    expect(features().hostedDatabase).toBe(true);
  });

  it('turns on durable storage with a Blob token', () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_test';
    expect(features().durableImageStorage).toBe(true);
  });

  it('needs both the Resend key and a from address for email delivery', () => {
    process.env.RESEND_API_KEY = 're_test';
    expect(features().emailDelivery).toBe(false);
    process.env.NOTIFY_FROM_EMAIL = 'noreply@example.com';
    expect(features().emailDelivery).toBe(true);
  });

  it('turns geocoding off only for DISABLE_GEOCODING=1', () => {
    process.env.DISABLE_GEOCODING = '1';
    expect(features().geocoding).toBe(false);
    process.env.DISABLE_GEOCODING = '0';
    expect(features().geocoding).toBe(true);
  });

  it('exposes the review route only when a token is set', () => {
    expect(features().feedbackReview).toBe(false);
    process.env.FEEDBACK_REVIEW_TOKEN = 'review-token';
    expect(features().feedbackReview).toBe(true);
  });
});

describe('supportEmail', () => {
  it('defaults to an inbox the owner reads', () => {
    expect(supportEmail()).toBe('support@lscaturchio.xyz');
  });

  it('reads SUPPORT_EMAIL when it is a valid address', () => {
    process.env.SUPPORT_EMAIL = '  help@example.com ';
    expect(supportEmail()).toBe('help@example.com');
  });

  it('throws on a misconfigured address rather than mailing nowhere', () => {
    process.env.SUPPORT_EMAIL = 'not-an-email';
    expect(() => supportEmail()).toThrow(/SUPPORT_EMAIL/);
  });
});

describe('beta flag', () => {
  it('is on, with one label the surface reuses', () => {
    expect(BETA).toBe(true);
    expect(betaLabel).toBe('Private beta');
  });
});
