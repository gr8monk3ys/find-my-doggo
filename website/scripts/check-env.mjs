#!/usr/bin/env node
/* global console, process */
/**
 * check-env.mjs — is this environment configured for the place it will run?
 *
 *   npm run check:env                  local: everything is optional, prints the table
 *   npm run check:env -- --preview     preview deployment: hosted database + Blob required
 *   npm run check:env -- --production  production: also email + a geocoder User-Agent
 *
 * Reads `.env` and `.env.local` from website/ (the real process environment
 * wins over both), classifies every variable in scripts/lib/env-spec.mjs and
 * prints one row per variable: set or unset, which environments need it, the
 * verdict and what breaks without it. Exits 1 when the target environment is
 * missing a required value or a set value is malformed.
 *
 * It never prints a value. Run it against a `vercel env pull .env.local`
 * before the first deploy and whenever the dashboard changes.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classify, ENVIRONMENTS, mergeEnv } from './lib/env-spec.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOTENV_FILES = ['.env', '.env.local'];

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('usage: node scripts/check-env.mjs [--local | --preview | --production]');
  process.exit(0);
}
const target = ENVIRONMENTS.find((env) => args.includes(`--${env}`)) ?? 'local';
const unknown = args.filter((arg) => !ENVIRONMENTS.some((env) => arg === `--${env}`));
if (unknown.length > 0) {
  console.error(`unknown argument(s): ${unknown.join(' ')}`);
  process.exit(2);
}

const files = DOTENV_FILES.filter((name) => existsSync(join(ROOT, name))).map((name) => ({
  name,
  text: readFileSync(join(ROOT, name), 'utf8'),
}));
const { rows, failures, ok } = classify(mergeEnv(files, process.env), target);

console.log(`Environment check for: ${target}`);
console.log(
  files.length > 0
    ? `Loaded ${files.map((file) => file.name).join(' + ')} (process environment takes precedence). Values are never shown.`
    : 'No .env or .env.local found; checking the process environment only.',
);
console.log('');

const header = ['Variable', 'Status', 'Needed in', 'Verdict', 'Notes'];
const table = rows.map((row) => [
  row.name,
  row.set ? 'set' : 'unset',
  row.requiredIn.length > 0 ? row.requiredIn.join(', ') : 'optional',
  row.verdict,
  row.detail,
]);

const widths = header.map((title, column) =>
  Math.max(title.length, ...table.map((cells) => (column === header.length - 1 ? 0 : cells[column].length))),
);
const line = (cells) =>
  cells.map((cell, column) => (column === header.length - 1 ? cell : cell.padEnd(widths[column]))).join('  ');
console.log(line(header));
console.log(line(widths.map((width) => '-'.repeat(width))));
for (const cells of table) console.log(line(cells));

const notes = rows.filter((row) => row.note);
if (notes.length > 0) {
  console.log('');
  console.log('Advice:');
  for (const row of notes) console.log(`  - ${row.name} ${row.note}`);
}

console.log('');
if (ok) {
  console.log(`OK: nothing ${target} requires is missing or malformed.`);
  process.exit(0);
}
console.error(`FAIL: ${failures.length} problem(s) for ${target}:`);
for (const failure of failures) console.error(`  - ${failure}`);
process.exit(1);
