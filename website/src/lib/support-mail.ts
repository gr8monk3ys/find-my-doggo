import { ensureSchema, getClient } from './db';
import { features, supportEmail } from './features';
import { type EmailMessage, sendEmail } from './notify';
import type { MessageInput } from './validation';

/**
 * Every email that goes to the support inbox passes through here, under one
 * global cap per flow: at most SUPPORT_EMAILS_PER_HOUR attempts in a rolling
 * hour across all clients, counted separately for `contact` (the contact
 * form, including takedown requests) and `feedback` (the beta dialog), so a
 * flood of one cannot starve the other. The per-client limiter is in-process
 * and keyed on a header, so a flood from many addresses or instances would
 * otherwise reach the inbox unchecked. The count lives in the database
 * (`email_sends`) so it holds across serverless instances.
 *
 * A slot is reserved atomically: one INSERT … SELECT whose WHERE counts the
 * window, so two concurrent requests cannot both squeeze through the last
 * slot (no count-then-insert race). If the mailer then fails the reservation
 * is deleted, so a transient Resend error does not burn a slot; the caller's
 * row is already persisted and reports `delivered: false`, and the operator
 * sees the failure in the log.
 *
 * Listing enquiries (finder → reporter) do not come through here; they are
 * per-client limited only.
 */
export type SupportMailKind = 'contact' | 'feedback';
export const SUPPORT_MAIL_KINDS: readonly SupportMailKind[] = ['contact', 'feedback'];
export const SUPPORT_EMAILS_PER_HOUR = 20;
const HOUR_MS = 60 * 60 * 1000;

const capLogged: Record<SupportMailKind, boolean> = { contact: false, feedback: false };

export type SupportEmail = Omit<EmailMessage, 'to'>;

const windowStart = () => new Date(Date.now() - HOUR_MS).toISOString();

export async function sendSupportEmail(kind: SupportMailKind, message: SupportEmail): Promise<boolean> {
  const to = supportEmail();
  // Nothing to cap when nothing is sent; sendEmail logs the "not configured" line.
  if (!features().emailDelivery) return sendEmail({ ...message, to });

  await ensureSchema();
  const db = getClient();
  const id = crypto.randomUUID();
  const reserved = await db.execute({
    sql: `INSERT INTO email_sends (id, kind, created_at)
          SELECT ?, ?, ?
          WHERE (SELECT COUNT(*) FROM email_sends WHERE kind = ? AND created_at > ?) < ?`,
    args: [id, kind, new Date().toISOString(), kind, windowStart(), SUPPORT_EMAILS_PER_HOUR],
  });

  if (reserved.rowsAffected !== 1) {
    if (!capLogged[kind]) {
      console.warn(
        `[support-mail] hourly cap of ${SUPPORT_EMAILS_PER_HOUR} ${kind} emails reached; ` +
          'further messages are stored but not emailed until the window moves on',
      );
      capLogged[kind] = true;
    }
    return false;
  }
  capLogged[kind] = false;

  const sent = await sendEmail({ ...message, to });
  if (!sent) {
    await db.execute({ sql: `DELETE FROM email_sends WHERE id = ?`, args: [id] }).catch(() => {});
  }
  return sent;
}

/** A general contact-form message, to the support inbox. */
export function forwardContact(message: MessageInput): Promise<boolean> {
  return sendSupportEmail('contact', {
    replyTo: message.email,
    subject: `Find My Doggo contact: ${message.subject}`,
    text: `${message.name} (${message.email}) wrote through the contact form:\n\n${message.message}\n\nReply to this email to answer them.`,
  });
}

export interface SupportMailStats {
  /** Emails that reached the mailer in the last hour. */
  sentLastHour: number;
  capPerHour: number;
  /** The window is full: the next message of this kind is stored but not emailed. */
  capped: boolean;
}

/** Per-flow counts for the health check, so an operator notices a full window. */
export async function supportMailStats(): Promise<Record<SupportMailKind, SupportMailStats>> {
  await ensureSchema();
  const { rows } = await getClient().execute({
    sql: `SELECT kind, COUNT(*) AS n FROM email_sends WHERE created_at > ? GROUP BY kind`,
    args: [windowStart()],
  });
  const counts = new Map(rows.map((row) => [String(row.kind), Number(row.n)]));
  const stats = {} as Record<SupportMailKind, SupportMailStats>;
  for (const kind of SUPPORT_MAIL_KINDS) {
    const sentLastHour = counts.get(kind) ?? 0;
    stats[kind] = { sentLastHour, capPerHour: SUPPORT_EMAILS_PER_HOUR, capped: sentLastHour >= SUPPORT_EMAILS_PER_HOUR };
  }
  return stats;
}

/** Test helper: forget that the cap warning was logged. */
export function resetSupportMailForTests(): void {
  for (const kind of SUPPORT_MAIL_KINDS) capLogged[kind] = false;
}
