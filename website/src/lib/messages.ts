import { ensureSchema, getClient } from './db';
import type { MessageInput } from './validation';

export interface StoredMessage extends MessageInput {
  id: string;
  /** Whether the message was emailed on (to the reporter, or to the support inbox). */
  delivered: boolean;
  createdAt: string;
}

export async function createMessage(input: MessageInput): Promise<StoredMessage> {
  await ensureSchema();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  await getClient().execute({
    sql: `INSERT INTO messages (id, dog_id, name, email, subject, body, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.dogId ?? null, input.name, input.email, input.subject, input.message, createdAt],
  });

  return { ...input, id, delivered: false, createdAt };
}

/** Records that the message was emailed on; rows left at 0 can be re-sent later. */
export async function markMessageDelivered(id: string): Promise<void> {
  await getClient().execute({ sql: `UPDATE messages SET delivered = 1 WHERE id = ?`, args: [id] });
}
