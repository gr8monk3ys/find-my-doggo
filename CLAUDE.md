# find-my-doggo

A lost-and-found dog noticeboard with no accounts: Next.js 16 App Router, React 19, TypeScript,
Tailwind v4, zod 4, Leaflet + react-leaflet, `@libsql/client` (SQLite file locally, Turso in
production), `@vercel/blob` for photos, Resend for enquiry emails. The app lives in `website/`;
there is no root `package.json`. npm, Node 22 (`engines` + `packageManager` in
`website/package.json`; CI runs the same). Public repo: everything committed here is public.

## Run / test

```bash
cd website
npm ci                      # Node 22 + npm 10, matching CI
npm run seed                # optional: six sample listings into data/dev.db
npm run dev                 # localhost:3000; no env needed (SQLite file + disk uploads)
npm run lint && npm run typecheck && npm test
npm run build && npm run test:e2e   # Playwright against `next start` on a throwaway data/e2e.db
```

`DISABLE_GEOCODING=1` keeps every test run off Nominatim. `website/.env.example` lists every
variable; all of them are optional locally.

CI (`.github/workflows/ci.yml`) runs two jobs on every PR, both required by master's branch
protection: `Lint, typecheck, unit tests, build` and `End-to-end tests`. Dependabot opens
security updates only (version bumps are off, `.github/dependabot.yml`).

## Releases

Commits follow Conventional Commits (`feat:`, `fix:`, `perf:`, `chore:`, …) and that is what cuts
releases: `release-please` (`.github/workflows/release-please.yml`, config at the repo root with
`packages.website`) keeps one release PR open against master that bumps `website/package.json`
and writes `website/CHANGELOG.md`. Merging it tags `vX.Y.Z` (no component prefix) and publishes a
GitHub Release. The release PR carries no CI run (it is opened by `GITHUB_TOKEN`), so it is merged
with `gh pr merge --admin` — only after `gh pr diff --name-only` shows exactly four files:
`website/CHANGELOG.md`, the version field in `website/package.json` and `website/package-lock.json`,
and `.release-please-manifest.json`; anything else in that diff means something is wrong, not that
the bypass should widen. A `feat` bumps minor, a `fix` bumps patch, a `!`/`BREAKING CHANGE`
bumps major; `Release-As: x.y.z` in a commit footer forces a version.

## Working conventions

- Work in a git worktree under `.worktrees/<branch-slug>` (ignored via `.git/info/exclude`), one
  per PR; never edit the main checkout except to fast-forward master.
- Open PRs with `gh pr create --base master`, watch `gh pr checks <N> --watch`, squash-merge with
  `gh pr merge <N> --squash --delete-branch`. Squash titles are the conventional commit that
  release-please reads.
- Never commit `.env*` files with values, and never paste keys into docs or issues.

## Where things live

- `website/src/app/` — routes: `/` (home), `/dogs`, `/dogs/[id]`, `/map`, `/report`, `/contact`,
  `/uploads/[filename]` (serves local disk uploads), `api/{dogs,messages,feedback,health}`
- `website/src/lib/` — `db.ts` (libSQL client; tables are created on first request by
  `ensureSchema`, there is no migrations directory), `dogs.ts` (`toPublicDog` is the PII
  chokepoint), `messages.ts`, `feedback.ts`, `notify.ts` (one `sendEmail` Resend seam behind
  `forwardEnquiry` / `forwardContact`), `features.ts` (every capability flag read from env, plus
  `supportEmail()` and the beta label — gate copy on these, never on raw env), `storage.ts`
  (disk or Blob), `geocode.ts` (Nominatim), `rate-limit.ts` (in-memory, per instance),
  `same-origin.ts` (the Origin / Sec-Fetch-Site check for mutating routes), `validation.ts`
  (zod), `site.ts`
- `website/src/components/` — navbar, footer, cards, map (`DogMap` → client-only `DogMapCanvas`),
  forms
- `website/tests/unit` (Vitest, node environment), `website/tests/e2e` (Playwright, production
  build on port 3100), `website/scripts/seed.mjs`
- `docs/agents/` — issue tracker, triage labels and domain-doc conventions for agents

## Gotchas

- The reporter's email never leaves the server. Every read path goes through `toPublicDog`
  (`lib/dogs.ts`); enquiries go through `POST /api/messages`, which resolves the address
  server-side. A unit test asserts this — keep it that way when adding fields or routes.
- Leaflet touches `window` at import time: anything that imports it is loaded through
  `next/dynamic` with `ssr: false` from a client component (`DogMap.tsx`). Markers are CSS
  `divIcon`s, not Leaflet's PNGs, so the bundler never has to locate icon images.
- Local uploads are written under `data/uploads`, not `public/`, and served by the `/uploads`
  route handler — `next start` resolves `public/` once at boot.
- Without `BLOB_READ_WRITE_TOKEN` uploads go to the local filesystem, which does not survive a
  serverless deploy; without `RESEND_API_KEY` + `NOTIFY_FROM_EMAIL` enquiries, contact messages
  and feedback are stored but not emailed. `GET /api/health` reports every flag in
  `lib/features.ts`. Every write API returns `delivered` and the forms show "saved" rather than
  "sent" when it is false — keep success copy honest when adding a channel. Anything that emails
  the support inbox goes through `lib/support-mail.ts`, which caps each flow (`contact`,
  `feedback`) at 20 emails per rolling hour across all clients, reserving the slot atomically in
  the `email_sends` table so it holds across instances; `/api/health` shows `mail.<kind>.capped`.
  Skipped or failed sends leave `delivered = 0` on the `messages` / `feedback` row
  (`GET /api/feedback?undelivered=1` lists them). `clientKey` keys the per-client limiter on
  `x-real-ip` or the last hop of `x-forwarded-for`, never the client-supplied first hop.
- The app is in a private beta with no public deployment. The footer carries the one beta notice
  and `supportEmail()` (default `support@lscaturchio.xyz`; an invalid `SUPPORT_EMAIL` throws on
  first render on purpose). `GET /api/feedback` is a 404 unless `FEEDBACK_REVIEW_TOKEN` is set;
  the e2e web server sets a throwaway token in `playwright.config.ts`.
- Next 16 writes `AGENTS.md`/`CLAUDE.md` into `website/` on dev start unless `agentRules: false`
  (already set in `next.config.ts`).
- Zod v4: `z.email()` is a top-level schema, not `z.string().email()`.

## Agent skills

### Issue tracker

GitHub Issues on `gr8monk3ys/find-my-doggo`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, label string equal to role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
