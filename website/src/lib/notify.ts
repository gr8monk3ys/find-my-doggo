import type { DogWithContact } from './types';
import type { MessageInput } from './validation';

/**
 * Delivery seam for the one email this app actually needs to send: forwarding
 * an enquiry to whoever reported the dog, without publishing their address.
 *
 * With RESEND_API_KEY set this sends for real. Without it the message is still
 * persisted and this logs instead, so local development and CI need no
 * credentials. Failures never propagate — the sender has already been told
 * their message was received, and the row in `messages` is the source of truth.
 */
export async function forwardEnquiry(dog: DogWithContact, message: MessageInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NOTIFY_FROM_EMAIL;

  if (!apiKey || !from) {
    console.info(
      `[notify] enquiry for dog ${dog.id} from ${message.email} stored but not emailed ` +
        '(set RESEND_API_KEY and NOTIFY_FROM_EMAIL to enable delivery)',
    );
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: dog.contactEmail,
        reply_to: message.email,
        subject: `Find My Doggo: ${message.subject}`,
        text:
          `${message.name} (${message.email}) sent you a message about ${dog.name} (${dog.breed}), ` +
          `reported ${dog.status} near ${dog.location.address}.\n\n${message.message}\n\n` +
          'Reply to this email to reach them directly.',
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(`[notify] Resend rejected enquiry ${message.subject}: ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[notify] failed to forward enquiry', error);
    return false;
  }
}

/** True when enquiries are actually delivered. Surfaced in the health check. */
export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.NOTIFY_FROM_EMAIL);
}
