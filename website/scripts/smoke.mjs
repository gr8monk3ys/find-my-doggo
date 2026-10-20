#!/usr/bin/env node
/* global console, process, fetch, AbortSignal */
/**
 * smoke.mjs — read-only smoke pass against a running deployment.
 *
 *   npm run smoke -- https://find-my-doggo.example
 *   npm run smoke -- http://localhost:3000
 *
 * Fetches every public page, robots.txt, the sitemap and /api/health with
 * plain `fetch` (no browser, no dependencies). Fails on any non-2xx response,
 * on a health `status` other than `ok`, and prints the `features` flags so
 * whoever runs it sees what the deployment has actually turned on. Nothing
 * here writes: no form is posted, no listing is created.
 *
 * Used by hand after a deploy (docs/LAUNCH_CHECKLIST.md) and daily by
 * .github/workflows/deploy-watchdog.yml when the repository variable
 * PRODUCTION_URL is set.
 */

const PAGES = ['/', '/dogs', '/map', '/report', '/contact'];
const METADATA = ['/robots.txt', '/sitemap.xml'];
const HEALTH = '/api/health';
const TIMEOUT_MS = 15_000;

const [rawBase] = process.argv.slice(2);
if (!rawBase) {
  console.error('usage: node scripts/smoke.mjs <base-url>');
  process.exit(2);
}
let base;
try {
  base = new URL(rawBase);
} catch {
  console.error(`not a URL: ${rawBase}`);
  process.exit(2);
}
const origin = base.toString().replace(/\/$/, '');

/** @type {string[]} */
const failures = [];
const pad = (text, width) => String(text).padEnd(width);

/**
 * @param {string} path
 * @param {{ expectType?: RegExp }} [options]
 * @returns {Promise<Response | null>}
 */
async function get(path, options = {}) {
  const url = `${origin}${path}`;
  const started = performance.now();
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'find-my-doggo-smoke', Accept: '*/*' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'follow',
    });
    const ms = Math.round(performance.now() - started);
    const type = response.headers.get('content-type') ?? '';
    const redirected = response.redirected ? ` -> ${response.url}` : '';
    let problem = null;
    if (!response.ok) problem = `HTTP ${response.status}`;
    else if (options.expectType && !options.expectType.test(type)) problem = `unexpected content-type "${type}"`;
    console.log(`${pad(problem ? 'FAIL' : 'ok', 5)} ${pad(response.status, 4)} ${pad(`${ms}ms`, 7)} ${path}${redirected}`);
    if (problem) failures.push(`${path}: ${problem}`);
    return response;
  } catch (error) {
    const ms = Math.round(performance.now() - started);
    const reason = error instanceof Error ? error.message : String(error);
    console.log(`${pad('FAIL', 5)} ${pad('-', 4)} ${pad(`${ms}ms`, 7)} ${path}  (${reason})`);
    failures.push(`${path}: ${reason}`);
    return null;
  }
}

console.log(`Smoke against ${origin}`);
console.log('');

for (const path of PAGES) await get(path, { expectType: /text\/html/ });
for (const path of METADATA) await get(path, { expectType: /text\/plain|xml/ });

const health = await get(HEALTH, { expectType: /application\/json/ });
console.log('');

if (health) {
  let body = null;
  try {
    body = await health.json();
  } catch {
    failures.push(`${HEALTH}: body is not JSON`);
  }
  if (body) {
    if (body.status !== 'ok') failures.push(`${HEALTH}: status is "${body.status}", expected "ok"`);
    console.log(`health:   status=${body.status} version=${body.version ?? '?'} database=${body.database ?? '?'} (${body.databaseLatencyMs ?? '?'} ms)`);

    if (body.features && typeof body.features === 'object') {
      console.log('features:');
      for (const [flag, value] of Object.entries(body.features)) {
        console.log(`  ${pad(flag, 22)} ${value === true ? 'on' : value === false ? 'off' : String(value)}`);
      }
    } else {
      failures.push(`${HEALTH}: no features block`);
    }

    if (body.mail && typeof body.mail === 'object') {
      console.log('support mail (last hour):');
      for (const [kind, stats] of Object.entries(body.mail)) {
        const s = /** @type {{ sentLastHour?: number, capPerHour?: number, capped?: boolean }} */ (stats);
        console.log(`  ${pad(kind, 22)} ${s.sentLastHour ?? '?'}/${s.capPerHour ?? '?'}${s.capped ? '  CAPPED' : ''}`);
      }
    }
  }
}

console.log('');
if (failures.length === 0) {
  console.log(`PASS: ${PAGES.length + METADATA.length + 1} requests, all 2xx, health ok.`);
  process.exit(0);
}
console.error(`FAIL: ${failures.length} problem(s)`);
for (const failure of failures) console.error(`  - ${failure}`);
process.exit(1);
