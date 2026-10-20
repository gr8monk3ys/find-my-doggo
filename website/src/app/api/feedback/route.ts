import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createFeedback, listFeedback, markFeedbackDelivered } from '@/lib/feedback';
import { checkRateLimit, clientKey } from '@/lib/rate-limit';
import { isSameOrigin } from '@/lib/same-origin';
import { sendSupportEmail } from '@/lib/support-mail';
import { feedbackSchema, fieldErrors } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const FEEDBACK_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;
const REVIEW_LIMIT = 100;

/**
 * A beta tester's note. Persisted always; emailed to the support inbox when
 * delivery is configured. The response says which happened.
 */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Feedback can only be sent from this site.' }, { status: 403 });
  }

  const limit = checkRateLimit(`feedback:${clientKey(request)}`, FEEDBACK_PER_HOUR, HOUR_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too much feedback from this address. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const parsed = feedbackSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please correct the highlighted fields.', fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  let saved;
  try {
    saved = await createFeedback({ ...parsed.data, userAgent: request.headers.get('user-agent') });
  } catch (error) {
    console.error('[api/feedback] persist failed', error);
    return NextResponse.json({ error: 'Could not save your feedback. Please try again.' }, { status: 500 });
  }

  // Through the capped support sink: with no mailer, or past the hourly cap,
  // the row stays and `delivered` is honestly false.
  const delivered = await sendSupportEmail('feedback', {
    replyTo: saved.email ?? undefined,
    subject: `New beta feedback on ${saved.page}`,
    text:
      `Page: ${saved.page}\nFrom: ${saved.email ?? 'no email given'}\n` +
      `Browser: ${saved.userAgent ?? 'unknown'}\nId: ${saved.id}\n\n${saved.message}`,
  });
  if (delivered) {
    await markFeedbackDelivered(saved.id).catch((error) => console.error('[api/feedback] mark delivered failed', error));
  }

  return NextResponse.json({ ok: true, delivered }, { status: 201 });
}

/** Constant-time on equal lengths; a length mismatch is a mismatch. */
function tokenMatches(presented: string, expected: string): boolean {
  const a = Buffer.from(presented);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * The reviewer's view: the newest notes, behind FEEDBACK_REVIEW_TOKEN. With
 * the variable unset the route does not exist for anyone (404), so a public
 * deployment that has not opted in exposes nothing. `?undelivered=1` narrows
 * to notes that were stored but never emailed, so they can be re-sent by hand.
 */
export async function GET(request: Request) {
  const expected = process.env.FEEDBACK_REVIEW_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  }

  const header = request.headers.get('authorization') ?? '';
  const presented = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (!presented || !tokenMatches(presented, expected)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401, headers: { 'WWW-Authenticate': 'Bearer' } });
  }

  const undelivered = new URL(request.url).searchParams.get('undelivered') === '1';
  try {
    const feedback = await listFeedback({ limit: REVIEW_LIMIT, undelivered });
    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('[api/feedback] list failed', error);
    return NextResponse.json({ error: 'Could not load feedback.' }, { status: 500 });
  }
}
