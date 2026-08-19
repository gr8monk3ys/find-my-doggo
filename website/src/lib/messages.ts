import { ensureSchema, getClient } from './db';
import type { MessageInput } from './validation';

export interface StoredMessage extends MessageInput {
  id: string;
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

  return { ...input, id, createdAt };
}
