# Launch checklist

What stands between the private beta and a public deployment. Every `[config]`
item is a dashboard step only the owner can do; the repo side of each one is
already in place. Do them in order: each later step depends on an earlier one.
`[done]` items are already true and are listed so nobody re-does them.

There is **no deployment today** (October 2026). The Vercel team has no project
for this repository; the only GitHub Deployment records are the 2019 Heroku app,
which is gone. Everything below that says "verified" was verified against a
local `next build && next start`, never against a live URL.

## Before the first deploy

1. `[config]` **Create the Vercel project** from the GitHub repository
   `gr8monk3ys/find-my-doggo`. In the import screen set **Root Directory:
   `website`** (the repo has no root `package.json`), Framework Preset
   **Next.js**, Node.js version **22.x** (Project → Settings → General). Leave
   the build and install commands at their defaults (`next build`, `npm ci`).
   Connecting the repo is what makes `.github/workflows/deploy-watchdog.yml`
   start caring: it passes with a warning until the first Vercel deployment
   exists, then fails whenever master has no successful one.

2. `[config]` **Turso database.** Create a database (`turso db create
   find-my-doggo`), then a token (`turso db tokens create find-my-doggo`). Set
   `DATABASE_URL` (the `libsql://…turso.io` URL) and `DATABASE_AUTH_TOKEN` in
   Vercel for **Production and Preview**. Tables are created on first request
   by `ensureSchema` (`website/src/lib/db.ts`); there is nothing to migrate.
   Preview deployments need a hosted database too: the serverless filesystem
   does not keep `data/dev.db` between invocations.

3. `[config]` **Vercel Blob store** (Storage → Create → Blob), connected to the
   project so `BLOB_READ_WRITE_TOKEN` is injected for Production and Preview.
   Without it photos are written to the instance's disk and vanish.

4. `[config]` **Resend.** Verify a domain the owner controls (Resend → Domains:
   add the DNS records it shows). Create an API key and set `RESEND_API_KEY`;
   set `NOTIFY_FROM_EMAIL` to an address on that verified domain, for example
   `Find My Doggo <noreply@<domain>>`. Both are needed before `features().emailDelivery`
   turns on; until then every form says "saved" instead of "sent" and nobody is
   emailed. Production only is fine; a preview with no mailer is honest about it.

5. `[config]` **`GEOCODER_USER_AGENT`**: an identifying string **with a contact
   address**, for example `find-my-doggo/0.4 (ops@<domain>)`. Nominatim's usage
   policy requires it and allows about one request per second across the whole
   deployment (the report form is rate limited accordingly). A busy site needs
   a paid or self-hosted geocoder: set `GEOCODER_URL` to its `/search` endpoint
   when that day comes.

6. `[config]` **`SUPPORT_EMAIL`**: the inbox contact-form messages and feedback
   go to, shown in the footer. Defaults to `support@lscaturchio.xyz`; set it
   only to move to another inbox someone actually reads. An invalid value makes
   every page throw on purpose.

7. `[config]` **`FEEDBACK_REVIEW_TOKEN`**: `openssl rand -hex 32`, set in
   Production. It unlocks `GET /api/feedback` (`Authorization: Bearer <token>`)
   so beta feedback can be read; unset, that route is a 404 and feedback is
   only reachable in the database.

8. `[config]` **`NEXT_PUBLIC_SITE_URL`** once a custom domain is attached
   (Project → Settings → Domains), so the sitemap, `robots.txt` and OpenGraph
   URLs use it. On a bare `*.vercel.app` URL it can stay unset: `lib/site.ts`
   infers the origin from `VERCEL_PROJECT_PRODUCTION_URL`.

9. **Audit the environment before deploying.** From `website/`:

   ```bash
   vercel link                     # once, to the project from step 1
   vercel env pull .env.local --environment=production
   npm run check:env -- --production
   rm .env.local                   # or keep it; .env* is git-ignored
   ```

   The check prints one row per variable (set/unset, which environments need
   it, what breaks without it) and exits 1 while anything production requires
   is missing or malformed. It never prints a value. `--preview` does the same
   for a preview pull.

## After the first deploy

10. **Smoke the deployment.** `npm run smoke -- https://<deployment-url>`
    fetches `/`, `/dogs`, `/map`, `/report`, `/contact`, `/robots.txt`,
    `/sitemap.xml` and `/api/health`, fails on any non-2xx or a health status
    other than `ok`, and prints the `features` flags the deployment reports.
    Every flag should read `on`; an `off` means a step above was
    skipped or a value is wrong.

11. `[config]` **Set the repository variable `PRODUCTION_URL`** (GitHub →
    Settings → Secrets and variables → Actions → Variables) to the production
    origin, for example `https://find-my-doggo.vercel.app`. The daily
    `deploy-watchdog.yml` then runs the same smoke against it. Trigger it once
    by hand (`gh workflow run deploy-watchdog.yml`) and read the run.

12. Walk the core loop once by hand on the live site: report a dog with a
    photo and a real address (it should land on the map), find it in the
    listings, open it from the map, send an enquiry from another email address
    and confirm the reporter receives it. Then send a note through the
    **Feedback** dialog and read it back with the review token. Delete the
    test listing afterwards; there is no UI for that yet, so it is a `DELETE
    FROM dogs WHERE id = …` in the Turso shell.

## Already done

- `[done]` **Secret scanning and push protection** are on for the repository.
- `[done]` **Dependabot** security alerts and security updates are on
  (`.github/dependabot.yml` turns version bumps off; security PRs still open).
- `[done]` **release-please** cuts `vX.Y.Z` from conventional commits on master
  (`.github/workflows/release-please.yml`; see `CLAUDE.md` → Releases).
- `[done]` **Branch protection** on master requires both CI checks (`Lint,
  typecheck, unit tests, build` and `End-to-end tests`).
- `[done]` **`GET /api/health`** reports the database (with latency), the
  version, every feature flag and the support-mail caps.
- `[done]` **`deploy-watchdog.yml`**, `scripts/smoke.mjs`, `scripts/check-env.mjs`
  (this PR). The watchdog passes with a warning until step 1 is done.

## Not done / follow-ups

Things a public launch wants that this beta deliberately does not have.

- **Error reporting.** There is no Sentry and no DSN. When the owner wants it:
  `npm i @sentry/nextjs`, run its wizard with the DSN in `SENTRY_DSN`, and set
  `release` to the version from `website/package.json` so errors line up with
  release-please tags. Until then `app/error.tsx` logs to the server console
  and Vercel's runtime logs are the only trace.
- **Shared rate-limit store.** `lib/rate-limit.ts` is an in-memory counter per
  instance; it slows one client down and does nothing against a distributed
  flood or a scale-out. Before opening the site up, move it to Upstash Redis
  (or Vercel KV) or put a Vercel WAF rate-limit rule in front of `POST
  /api/dogs`, `/api/messages` and `/api/feedback`. The support-mail cap
  (`lib/support-mail.ts`) already lives in the database and needs no change.
- **Moderation queue.** Submissions are validated, not reviewed. Anyone can
  post, nobody can edit or delete. A queue (new listings held until approved),
  an abuse-report link on each listing and a takedown path shorter than "email
  support" are all wanted before the site is advertised.
- **Listing expiry.** Nothing ages out. Lost-dog listings from months ago sit
  beside today's. A `resolved_at`/archive flag plus a scheduled job (Vercel
  Cron) to hide stale listings would keep the noticeboard current.
- **Paid geocoder.** See step 5; Nominatim is fine for a trickle, not a launch.
