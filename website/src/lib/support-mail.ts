import { ensureSchema, getClient } from './db';
import { features, supportEmail } from './features';
import { type EmailMessage, sendEmail } from './notify';
import type { MessageInput } from './validation';

/**
 * Every email that goes to the support inbox passes through here, under one
 * global cap: at most SUPPORT_EMAILS_PER_HOUR attempts in a rolling hour
 * across all clients. The per-client limiter is in-process and keyed on a
 * header, so a flood from rotating addresses or instances would otherwise
 * reach the inbox unchecked. The count lives in the database (`email_sends`)
 * so it holds across serverless instances.
 *
 * Attempts are counted, not successes: a rejected send still hit the sink.
 * When the cap is reached the caller's row is already persisted; this only
 * reports `false` so the UI shows the honest "saved, not emailed" state.
 */
export const SUPPORT_EMAILS_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;

let capLogged = false;

export type SupportEmail = Omit<EmailMessage, 'to'>;

export async function sendSupportEmail(message: SupportEmail): Promise<boolean> {
  const to = supportEmail();
  // Nothing to cap when nothing is sent; sendEmail logs the "not configured" line.
  if (!features().emailDelivery) return sendEmail({ ...message, to });

  await ensureSchema();
  const db = getClient();
  const since = new Date(Date.now() - HOUR_MS).toISOString();
  const { rows } = await db.execute({
    sql: `SELECT COUNT(*) AS n FROM email_sends WHERE kind = 'support' AND created_at > ?`,
    args: [since],
  });

  if (Number(rows[0]?.n ?? 0) >= SUPPORT_EMAILS_PER_HOUR) {
    if (!capLogged) {
      console.warn(
        `[support-mail] hourly cap of ${SUPPORT_EMAILS_PER_HOUR} support emails reached; ` +
          'further messages are stored but not emailed until the window moves on',
      );
      capLogged = true;
    }
    return false;
  }
  capLogged = false;

  await db.execute({
    sql: `INSERT INTO email_sends (id, kind, created_at) VALUES (?, 'support', ?)`,
    args: [crypto.randomUUID(), new Date().toISOString()],
  });
  return sendEmail({ ...message, to });
}

/** A general contact-form message, to the support inbox. */
export function forwardContact(message: MessageInput): Promise<boolean> {
  return sendSupportEmail({
    replyTo: message.email,
    subject: `Find My Doggo contact: ${message.subject}`,
    text: `${message.name} (${message.email}) wrote through the contact form:\n\n${message.message}\n\nReply to this email to answer them.`,
  });
}

/** Test helper: forget that the cap warning was logged. */
export function resetSupportMailForTests(): void {
  capLogged = false;
}
