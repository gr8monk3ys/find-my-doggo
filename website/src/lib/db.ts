import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { createClient, type Client } from '@libsql/client';

/**
 * Local dev needs no configuration at all: the default URL is a SQLite file
 * under `website/data/`. In production `DATABASE_URL` points at a libSQL/Turso
 * instance and `DATABASE_AUTH_TOKEN` carries its credential. Same client and
 * the same SQL either way.
 */
const DEFAULT_URL = 'file:./data/dev.db';

let client: Client | undefined;
let schemaReady: Promise<void> | undefined;

/**
 * libSQL creates a missing SQLite file but not a missing directory, so a fresh
 * clone with no `data/` would fail on the very first query. Creating it here
 * keeps "clone, install, run" working with no setup step.
 */
function ensureLocalDirectory(url: string): void {
  if (!url.startsWith('file:')) return;
  const filePath = url.slice('file:'.length);
  if (!filePath) return;
  mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
}

export function getClient(): Client {
  if (!client) {
    const url = process.env.DATABASE_URL ?? DEFAULT_URL;
    ensureLocalDirectory(url);
    client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  }
  return client;
}

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS dogs (
     id            TEXT PRIMARY KEY,
     name          TEXT NOT NULL,
     breed         TEXT NOT NULL,
     color         TEXT NOT NULL,
     description   TEXT NOT NULL,
     status        TEXT NOT NULL CHECK (status IN ('lost', 'found', 'reunited')),
     image_url     TEXT,
     address       TEXT NOT NULL,
     lat           REAL,
     lng           REAL,
     contact_email TEXT NOT NULL,
     contact_phone TEXT,
     created_at    TEXT NOT NULL,
     updated_at    TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_dogs_status  ON dogs (status)`,
  `CREATE INDEX IF NOT EXISTS idx_dogs_created ON dogs (created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS messages (
     id         TEXT PRIMARY KEY,
     dog_id     TEXT REFERENCES dogs (id) ON DELETE CASCADE,
     name       TEXT NOT NULL,
     email      TEXT NOT NULL,
     subject    TEXT NOT NULL,
     body       TEXT NOT NULL,
     created_at TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS idx_messages_dog ON messages (dog_id)`,
];

/**
 * Idempotent, so it is safe to call on every request. The promise is cached so
 * concurrent requests on a cold serverless instance only migrate once.
 */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getClient()
      .batch(MIGRATIONS, 'write')
      .then(() => undefined)
      .catch((err) => {
        // Let the next request retry rather than caching a failed migration.
        schemaReady = undefined;
        throw err;
      });
  }
  return schemaReady;
}

/** Test helper: drop the cached client so a new DATABASE_URL takes effect. */
export function resetClientForTests(): void {
  client?.close();
  client = undefined;
  schemaReady = undefined;
}
