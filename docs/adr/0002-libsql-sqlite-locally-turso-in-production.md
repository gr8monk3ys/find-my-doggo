# One libSQL client: a SQLite file locally, Turso in production

Status: accepted

## Context

The app needs a small relational store for listings, messages and feedback. Contributors should be able to clone, install and run with no setup, while production runs on serverless instances that cannot share a local file.

## Decision

All data access goes through `@libsql/client` (`website/src/lib/db.ts`). With no `DATABASE_URL` it opens a SQLite file at `data/dev.db`; in production `DATABASE_URL` and `DATABASE_AUTH_TOKEN` point at a hosted Turso instance. The same client and SQL run in both, and the schema is created idempotently by `ensureSchema`.

## Consequences

- No database setup step for local work, tests or e2e; tests use throwaway SQLite files.
- State that must hold across serverless instances (for example the support email cap in `email_sends`) lives in the database, not in process memory.
- Photos are separate: Vercel Blob in production, local disk otherwise (`website/src/lib/storage.ts`).
