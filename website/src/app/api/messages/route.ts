import { NextResponse } from 'next/server';
import { getDogWithContact } from '@/lib/dogs';
import { createMessage, markMessageDelivered } from '@/lib/messages';
import { forwardEnquiry } from '@/lib/notify';
import { forwardContact } from '@/lib/support-mail';
import { checkRateLimit, clientKey } from '@/lib/rate-limit';
import { isSameOrigin } from '@/lib/same-origin';
import { fieldErrors, messageSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

const MESSAGES_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Messages can only be sent from this site.' }, { status: 403 });
  }

  const limit = checkRateLimit(`message:${clientKey(request)}`, MESSAGES_PER_HOUR, HOUR_MS);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many messages from this address. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Expected a JSON body.' }, { status: 400 });
  }

  const parsed = messageSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please correct the highlighted fields.', fields: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  // Resolve the dog first: an enquiry pointing at a listing that no longer
  // exists has nowhere to go, and would leave an orphan row on cascade delete.
  const dog = parsed.data.dogId ? await getDogWithContact(parsed.data.dogId) : null;
  if (parsed.data.dogId && !dog) {
    return NextResponse.json({ error: 'That listing no longer exists.' }, { status: 404 });
  }

  let saved;
  try {
    saved = await createMessage(parsed.data);
  } catch (error) {
    console.error('[api/messages] persist failed', error);
    return NextResponse.json({ error: 'Could not send your message. Please try again.' }, { status: 500 });
  }

  // An enquiry goes to the reporter; anything else goes to the support inbox.
  // `delivered` is the truth of what happened, and the form's success copy
  // follows it rather than claiming the message was passed on.
  const delivered = dog ? await forwardEnquiry(dog, parsed.data) : await forwardContact(parsed.data);
  if (delivered) {
    await markMessageDelivered(saved.id).catch((error) => console.error('[api/messages] mark delivered failed', error));
  }
  return NextResponse.json({ ok: true, delivered }, { status: 201 });
}
