/**
 * env-spec.mjs — every environment variable the app reads, in one table:
 * what it is for, which environments need it, and what breaks without it.
 *
 * `scripts/check-env.mjs` renders this table and exits non-zero when a value
 * the target environment needs is missing or malformed. The unit test in
 * tests/unit/env-spec.test.ts pins the classification so the table and the
 * code paths in src/lib (features.ts, db.ts, storage.ts, notify.ts,
 * geocode.ts, site.ts) cannot drift apart silently.
 *
 * Nothing here ever returns or formats a value. The checker reports set /
 * unset and whether a set value has the right shape, and every message below
 * is written so it can be printed without echoing what was set.
 */

/** @typedef {'local' | 'preview' | 'production'} Environment */

/** @type {Environment[]} */
export const ENVIRONMENTS = ['local', 'preview', 'production'];

/**
 * @typedef {object} EnvVar
 * @property {string} name
 * @property {Environment[]} requiredIn   Environments where an unset value fails the check.
 * @property {string} purpose             One line: what the value is.
 * @property {string} without             What breaks, or what the app falls back to, when unset.
 * @property {(value: string, target: Environment) => string | null} [validate]
 *   Shape check for a set value. Returns a problem (fatal in every environment) or null.
 * @property {(value: string | undefined, target: Environment) => string | null} [advise]
 *   Non-fatal note for the target environment, or null.
 */

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
/** `Name <address@example.com>` or a bare address, the two shapes Resend accepts. */
const FROM_ADDRESS = /^(?:[^<>]+<[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+>|[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+)$/;
const HTTP_URL = /^https?:\/\/[^\s/]+(?:\/.*)?$/;

/** @param {string} value */
function isLocalDatabase(value) {
  return value.startsWith('file:') || value === ':memory:';
}

/** @type {EnvVar[]} */
export const ENV_VARS = [
  {
    name: 'DATABASE_URL',
    requiredIn: ['preview', 'production'],
    purpose: 'libSQL connection string (Turso in production).',
    without: 'Falls back to file:./data/dev.db. A serverless instance loses that file on every cold start.',
    validate: (value, target) => {
      if (isLocalDatabase(value)) {
        return target === 'local'
          ? null
          : 'points at a local SQLite file; a deployment needs a hosted libsql:// database';
      }
      if (!/^(libsql|https?|wss?):\/\//.test(value)) {
        return 'is not a libsql://, https:// or wss:// URL';
      }
      return null;
    },
  },
  {
    name: 'DATABASE_AUTH_TOKEN',
    requiredIn: ['preview', 'production'],
    purpose: 'Auth token for the hosted libSQL database.',
    without: 'Turso refuses the connection; every page that reads listings fails and /api/health reports the database unreachable.',
  },
  {
    name: 'BLOB_READ_WRITE_TOKEN',
    requiredIn: ['preview', 'production'],
    purpose: 'Vercel Blob store for uploaded photos.',
    without: 'Photos are written to data/uploads on local disk, which does not survive a redeploy or a second instance.',
  },
  {
    name: 'RESEND_API_KEY',
    requiredIn: ['production'],
    purpose: 'Resend API key used by lib/notify.ts for every outbound email.',
    without: 'Enquiries, contact messages and feedback are stored but nobody is emailed; the UI says "saved" instead of "sent".',
  },
  {
    name: 'NOTIFY_FROM_EMAIL',
    requiredIn: ['production'],
    purpose: 'From address for outbound email, on a domain verified in Resend.',
    without: 'Same as a missing RESEND_API_KEY: email delivery stays off (lib/features.ts needs both).',
    validate: (value) => (FROM_ADDRESS.test(value.trim()) ? null : 'is not an email address or "Name <address>"'),
  },
  {
    name: 'GEOCODER_USER_AGENT',
    requiredIn: ['production'],
    purpose: 'Identifying User-Agent with a contact address, which Nominatim’s usage policy requires.',
    without: 'Geocoding uses the repository URL as the agent. Fine for a laptop; a public site violates the policy and gets blocked.',
    validate: (value) =>
      value.includes('@') || /https?:\/\//.test(value) ? null : 'should include a contact address (an email or a URL)',
  },
  {
    name: 'GEOCODER_URL',
    requiredIn: [],
    purpose: 'A self-hosted or paid Nominatim-compatible endpoint.',
    without: 'The public Nominatim instance is used, at about one request per second for the whole deployment.',
    validate: (value) => (HTTP_URL.test(value) ? null : 'is not an http(s) URL'),
  },
  {
    name: 'DISABLE_GEOCODING',
    requiredIn: [],
    purpose: 'Set to 1 to skip geocoding entirely (tests, offline development).',
    without: 'Geocoding is on, which is the normal state.',
    advise: (value, target) =>
      value === '1' && target !== 'local'
        ? 'is 1: no listing on this deployment will ever get a map pin. Unset it unless that is intended.'
        : null,
  },
  {
    name: 'NEXT_PUBLIC_SITE_URL',
    requiredIn: [],
    purpose: 'Canonical origin for metadata, robots.txt and the sitemap.',
    without: 'Inferred from VERCEL_PROJECT_PRODUCTION_URL on Vercel, http://localhost:3000 elsewhere.',
    validate: (value) => (HTTP_URL.test(value) ? null : 'is not an http(s) origin'),
    advise: (value, target) =>
      target === 'production' && !value
        ? 'unset: fine on a *.vercel.app URL, but set it once a custom domain is attached so the sitemap and OpenGraph URLs use it.'
        : null,
  },
  {
    name: 'SUPPORT_EMAIL',
    requiredIn: [],
    purpose: 'Inbox for contact-form messages and feedback; shown in the footer.',
    without: 'Defaults to support@lscaturchio.xyz (lib/features.ts). An invalid value throws on first render.',
    validate: (value) => (EMAIL.test(value.trim()) ? null : 'is not a valid email address (the footer would throw)'),
  },
  {
    name: 'FEEDBACK_REVIEW_TOKEN',
    requiredIn: [],
    purpose: 'Bearer token that unlocks GET /api/feedback for reviewers.',
    without: 'GET /api/feedback returns 404; feedback is still stored and emailed.',
    validate: (value) => (value.trim().length >= 32 ? null : 'is shorter than 32 characters; use `openssl rand -hex 32`'),
    advise: (value, target) =>
      target === 'production' && !value ? 'unset: nobody can read submitted feedback except through the database.' : null,
  },
];

/**
 * @typedef {'ok' | 'missing' | 'invalid' | 'optional'} Verdict
 *   ok       set, and the shape check (if any) passed
 *   missing  unset, and the target environment requires it   (fatal)
 *   invalid  set, but the shape check failed                  (fatal)
 *   optional unset, and the target environment does not need it
 */

/**
 * @typedef {object} Row
 * @property {string} name
 * @property {boolean} set
 * @property {Environment[]} requiredIn
 * @property {Verdict} verdict
 * @property {string} detail   Why the verdict, or what the app does without the value. Never the value.
 * @property {string | null} note   Non-fatal advice for this target, or null.
 */

/**
 * A variable counts as set only when it has a non-blank value, so a
 * `.env.local` copied from `.env.example` (all `KEY=`) reads as nothing set.
 * @param {string | undefined} value
 */
export function isSet(value) {
  return typeof value === 'string' && value.trim() !== '';
}

/**
 * Classify every known variable against a target environment.
 * @param {Record<string, string | undefined>} values
 * @param {Environment} target
 * @returns {{ target: Environment, rows: Row[], failures: string[], ok: boolean }}
 */
export function classify(values, target) {
  if (!ENVIRONMENTS.includes(target)) {
    throw new Error(`unknown environment "${target}"; expected one of ${ENVIRONMENTS.join(', ')}`);
  }

  const rows = ENV_VARS.map((spec) => {
    const raw = values[spec.name];
    const set = isSet(raw);
    const required = spec.requiredIn.includes(target);
    const note = spec.advise ? spec.advise(set ? /** @type {string} */ (raw) : undefined, target) : null;

    if (!set) {
      return {
        name: spec.name,
        set,
        requiredIn: spec.requiredIn,
        verdict: /** @type {Verdict} */ (required ? 'missing' : 'optional'),
        detail: spec.without,
        note,
      };
    }

    const problem = spec.validate ? spec.validate(/** @type {string} */ (raw), target) : null;
    return {
      name: spec.name,
      set,
      requiredIn: spec.requiredIn,
      verdict: /** @type {Verdict} */ (problem ? 'invalid' : 'ok'),
      detail: problem ? `${spec.name} ${problem}` : spec.purpose,
      note,
    };
  });

  const failures = rows
    .filter((row) => row.verdict === 'missing' || row.verdict === 'invalid')
    .map((row) => (row.verdict === 'missing' ? `${row.name} is not set (required in ${target})` : row.detail));

  return { target, rows, failures, ok: failures.length === 0 };
}

/**
 * The subset of a dotenv file this project needs: `KEY=value`, optional
 * `export`, single or double quotes, `#` comments, blank lines. No variable
 * expansion, no multi-line values. Later lines win over earlier ones.
 * @param {string} text
 * @returns {Record<string, string>}
 */
export function parseDotenv(text) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, key, rest] = match;
    const quoted = /^(['"])(.*?)\1\s*(?:#.*)?$/.exec(rest);
    out[key] = quoted ? quoted[2] : rest.replace(/\s+#.*$/, '').trim();
  }
  return out;
}

/**
 * Merge dotenv files the way Next does for a production start: `.env`, then
 * `.env.local` on top, then the real process environment on top of both.
 * @param {Array<{ name: string, text: string }>} files   In precedence order, lowest first.
 * @param {Record<string, string | undefined>} processEnv
 */
export function mergeEnv(files, processEnv) {
  /** @type {Record<string, string | undefined>} */
  const merged = {};
  for (const file of files) Object.assign(merged, parseDotenv(file.text));
  for (const [key, value] of Object.entries(processEnv)) {
    if (value !== undefined) merged[key] = value;
  }
  return merged;
}
