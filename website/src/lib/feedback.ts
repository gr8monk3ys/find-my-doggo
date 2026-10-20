import { ensureSchema, getClient } from './db';

export type FeedbackStatus = 'new' | 'seen' | 'done';

export interface Feedback {
  id: string;
  page: string;
  message: string;
  email: string | null;
  userAgent: string | null;
  status: FeedbackStatus;
  /** Whether the note was also emailed to the support inbox. */
  delivered: boolean;
  createdAt: string;
}

export interface CreateFeedbackInput {
  page: string;
  message: string;
  email?: string;
  userAgent?: string | null;
}

type Row = Record<string, unknown>;

function rowToFeedback(row: Row): Feedback {
  return {
    id: String(row.id),
    page: String(row.page),
    message: String(row.message),
    email: row.email == null ? null : String(row.email),
    userAgent: row.user_agent == null ? null : String(row.user_agent),
    status: String(row.status) as FeedbackStatus,
    delivered: Number(row.delivered) === 1,
    createdAt: String(row.created_at),
  };
}

/** The beta tester's note, kept whether or not it could also be emailed. */
export async function createFeedback(input: CreateFeedbackInput): Promise<Feedback> {
  await ensureSchema();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const userAgent = input.userAgent ? input.userAgent.slice(0, 512) : null;

  await getClient().execute({
    sql: `INSERT INTO feedback (id, page, message, email, user_agent, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'new', ?)`,
    args: [id, input.page, input.message, input.email ?? null, userAgent, createdAt],
  });

  return {
    id,
    page: input.page,
    message: input.message,
    email: input.email ?? null,
    userAgent,
    status: 'new',
    delivered: false,
    createdAt,
  };
}

/** Records that the note reached the support inbox. */
export async function markFeedbackDelivered(id: string): Promise<void> {
  await getClient().execute({ sql: `UPDATE feedback SET delivered = 1 WHERE id = ?`, args: [id] });
}

/** Newest first. For reviewers through GET /api/feedback; there is no admin UI. */
export async function listFeedback(limit = 100): Promise<Feedback[]> {
  await ensureSchema();
  const bounded = Math.min(Math.max(limit, 1), 500);
  const result = await getClient().execute({
    sql: `SELECT id, page, message, email, user_agent, status, delivered, created_at
          FROM feedback ORDER BY created_at DESC, rowid DESC LIMIT ?`,
    args: [bounded],
  });
  return result.rows.map((row) => rowToFeedback(row as Row));
}
