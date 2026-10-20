import { features, supportEmail } from './features';
import type { DogWithContact } from './types';
import type { MessageInput } from './validation';

export interface EmailMessage {
  to: string;
  /** The sender, so a reply from the inbox goes straight back to them. */
  replyTo?: string;
  subject: string;
  text: string;
}

/**
 * The one delivery seam: a raw Resend call, used for forwarding an enquiry to
 * a reporter, a contact message to the support inbox, and beta feedback.
 *
 * With RESEND_API_KEY and NOTIFY_FROM_EMAIL set this sends for real. Without
 * them it logs and returns false, so local development and CI need no
 * credentials and the caller can tell the truth about what happened: every
 * caller has already persisted the row, which is the source of truth. Failures
 * never propagate.
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  if (!features().emailDelivery) {
    console.info(
      `[notify] "${message.subject}" stored but not emailed ` +
        '(set RESEND_API_KEY and NOTIFY_FROM_EMAIL to enable delivery)',
    );
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.NOTIFY_FROM_EMAIL,
        to: message.to,
        reply_to: message.replyTo,
        subject: message.subject,
        text: message.text,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(`[notify] Resend rejected "${message.subject}": ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[notify] failed to send "${message.subject}"`, error);
    return false;
  }
}

/** Forwards an enquiry to whoever reported the dog, without publishing their address. */
export function forwardEnquiry(dog: DogWithContact, message: MessageInput): Promise<boolean> {
  return sendEmail({
    to: dog.contactEmail,
    replyTo: message.email,
    subject: `Find My Doggo: ${message.subject}`,
    text:
      `${message.name} (${message.email}) sent you a message about ${dog.name} (${dog.breed}), ` +
      `reported ${dog.status} near ${dog.location.address}.\n\n${message.message}\n\n` +
      'Reply to this email to reach them directly.',
  });
}

/** A general contact-form message, to the support inbox. */
export function forwardContact(message: MessageInput): Promise<boolean> {
  return sendEmail({
    to: supportEmail(),
    replyTo: message.email,
    subject: `Find My Doggo contact: ${message.subject}`,
    text: `${message.name} (${message.email}) wrote through the contact form:\n\n${message.message}\n\nReply to this email to answer them.`,
  });
}
