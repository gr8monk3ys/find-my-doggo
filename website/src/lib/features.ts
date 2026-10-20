import { z } from 'zod';

/**
 * What this deployment can actually do, read from the same environment the
 * code paths read. Copy that promises a capability is gated on these flags so
 * the surface never advertises something production cannot deliver.
 *
 * Server-only: every value here comes from process.env.
 */
export interface Features {
  /** DATABASE_URL points at a hosted libSQL/Turso instance rather than a local file. */
  hostedDatabase: boolean;
  /** Photos go to Vercel Blob and survive a redeploy. */
  durableImageStorage: boolean;
  /** Enquiries, contact messages and feedback are emailed, not just stored. */
  emailDelivery: boolean;
  /** Addresses are geocoded so a listing gets a pin on the map. */
  geocoding: boolean;
  /** GET /api/feedback is reachable for reviewers. */
  feedbackReview: boolean;
}

export function features(): Features {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? '';
  return {
    hostedDatabase: databaseUrl !== '' && !databaseUrl.startsWith('file:'),
    durableImageStorage: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    emailDelivery: Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_FROM_EMAIL),
    geocoding: process.env.DISABLE_GEOCODING !== '1',
    feedbackReview: Boolean(process.env.FEEDBACK_REVIEW_TOKEN),
  };
}

/** The app has no public deployment yet; every surface that mentions it says so once. */
export const BETA = true as const;
export const betaLabel = 'Private beta';

/** An inbox the owner reads. The same address InfiniStar uses. */
const DEFAULT_SUPPORT_EMAIL = 'support@lscaturchio.xyz';

/**
 * Where contact messages and feedback go. Read from SUPPORT_EMAIL; an invalid
 * value throws at first use (the footer renders it on every page) so a typo
 * fails loudly instead of sending mail nowhere.
 */
export function supportEmail(): string {
  const raw = process.env.SUPPORT_EMAIL?.trim();
  if (!raw) return DEFAULT_SUPPORT_EMAIL;
  const parsed = z.email().safeParse(raw);
  if (!parsed.success) {
    throw new Error('SUPPORT_EMAIL is set but is not a valid email address');
  }
  return parsed.data;
}
