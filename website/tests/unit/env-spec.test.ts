import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { classify, ENV_VARS, isSet, mergeEnv, parseDotenv } from '../../scripts/lib/env-spec.mjs';

const WEBSITE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** Every variable `.env.example` documents, so the table and the example file cannot drift apart. */
const DOCUMENTED = Object.keys(parseDotenv(readFileSync(path.join(WEBSITE_ROOT, '.env.example'), 'utf8')));

/** A complete, well-formed production environment. Placeholder shapes only. */
const PRODUCTION = {
  DATABASE_URL: 'libsql://find-my-doggo-example.turso.io',
  DATABASE_AUTH_TOKEN: 'placeholder-token',
  BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_placeholder',
  RESEND_API_KEY: 're_placeholder',
  NOTIFY_FROM_EMAIL: 'Find My Doggo <noreply@example.com>',
  GEOCODER_USER_AGENT: 'find-my-doggo (contact: ops@example.com)',
};

const verdictOf = (result: ReturnType<typeof classify>, name: string) =>
  result.rows.find((row) => row.name === name)?.verdict;

describe('ENV_VARS', () => {
  it('lists exactly the variables .env.example documents', () => {
    expect(ENV_VARS.map((spec) => spec.name).sort()).toEqual([...DOCUMENTED].sort());
  });

  it('requires in production exactly the six values a deployment cannot run without', () => {
    const required = ENV_VARS.filter((spec) => spec.requiredIn.includes('production')).map((spec) => spec.name);
    expect(required.sort()).toEqual(
      [
        'DATABASE_URL',
        'DATABASE_AUTH_TOKEN',
        'BLOB_READ_WRITE_TOKEN',
        'RESEND_API_KEY',
        'NOTIFY_FROM_EMAIL',
        'GEOCODER_USER_AGENT',
      ].sort(),
    );
  });

  it('requires nothing locally, and only the storage trio in preview', () => {
    expect(ENV_VARS.filter((spec) => spec.requiredIn.includes('local'))).toEqual([]);
    const preview = ENV_VARS.filter((spec) => spec.requiredIn.includes('preview')).map((spec) => spec.name);
    expect(preview.sort()).toEqual(['BLOB_READ_WRITE_TOKEN', 'DATABASE_AUTH_TOKEN', 'DATABASE_URL']);
  });

  it('explains every variable: a purpose and what breaks without it', () => {
    for (const spec of ENV_VARS) {
      expect(spec.purpose.length, spec.name).toBeGreaterThan(10);
      expect(spec.without.length, spec.name).toBeGreaterThan(10);
    }
  });
});

describe('classify', () => {
  it('passes an empty environment locally and marks every variable optional', () => {
    const result = classify({}, 'local');
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
    expect(new Set(result.rows.map((row) => row.verdict))).toEqual(new Set(['optional']));
  });

  it('fails production on a bare environment and names each missing variable', () => {
    const result = classify({}, 'production');
    expect(result.ok).toBe(false);
    expect(result.rows.filter((row) => row.verdict === 'missing').map((row) => row.name).sort()).toEqual(
      Object.keys(PRODUCTION).sort(),
    );
    expect(result.failures).toHaveLength(6);
    expect(result.failures.every((failure) => failure.endsWith('(required in production)'))).toBe(true);
  });

  it('passes a complete production environment', () => {
    const result = classify(PRODUCTION, 'production');
    expect(result.ok).toBe(true);
    for (const name of Object.keys(PRODUCTION)) expect(verdictOf(result, name), name).toBe('ok');
  });

  it('treats a blank value as unset, so a copied .env.example configures nothing', () => {
    expect(isSet('')).toBe(false);
    expect(isSet('   ')).toBe(false);
    expect(isSet(undefined)).toBe(false);
    expect(isSet('x')).toBe(true);
    const result = classify({ ...PRODUCTION, RESEND_API_KEY: '   ' }, 'production');
    expect(verdictOf(result, 'RESEND_API_KEY')).toBe('missing');
  });

  it('rejects a file: DATABASE_URL outside local, and accepts it locally', () => {
    expect(verdictOf(classify({ DATABASE_URL: 'file:./data/dev.db' }, 'local'), 'DATABASE_URL')).toBe('ok');
    const production = classify({ ...PRODUCTION, DATABASE_URL: 'file:./data/dev.db' }, 'production');
    expect(verdictOf(production, 'DATABASE_URL')).toBe('invalid');
    expect(production.ok).toBe(false);
    expect(production.failures[0]).toMatch(/local SQLite file/);
    expect(verdictOf(classify({ DATABASE_URL: 'file:./data/dev.db' }, 'preview'), 'DATABASE_URL')).toBe('invalid');
  });

  it('rejects a DATABASE_URL that is not a libsql, https or wss URL', () => {
    expect(verdictOf(classify({ DATABASE_URL: 'postgres://x' }, 'local'), 'DATABASE_URL')).toBe('invalid');
    expect(verdictOf(classify({ DATABASE_URL: 'https://db.example.turso.io' }, 'local'), 'DATABASE_URL')).toBe('ok');
  });

  it('checks the shape of a set value in every environment, not only the required ones', () => {
    const result = classify(
      {
        NOTIFY_FROM_EMAIL: 'not-an-address',
        SUPPORT_EMAIL: 'nobody',
        NEXT_PUBLIC_SITE_URL: 'example.com',
        GEOCODER_URL: 'ftp://geocoder',
        FEEDBACK_REVIEW_TOKEN: 'short',
        GEOCODER_USER_AGENT: 'find-my-doggo',
      },
      'local',
    );
    expect(result.ok).toBe(false);
    for (const name of [
      'NOTIFY_FROM_EMAIL',
      'SUPPORT_EMAIL',
      'NEXT_PUBLIC_SITE_URL',
      'GEOCODER_URL',
      'FEEDBACK_REVIEW_TOKEN',
      'GEOCODER_USER_AGENT',
    ]) {
      expect(verdictOf(result, name), name).toBe('invalid');
    }
  });

  it('accepts both from-address shapes Resend takes', () => {
    expect(verdictOf(classify({ NOTIFY_FROM_EMAIL: 'noreply@example.com' }, 'local'), 'NOTIFY_FROM_EMAIL')).toBe('ok');
    expect(
      verdictOf(classify({ NOTIFY_FROM_EMAIL: 'Find My Doggo <noreply@example.com>' }, 'local'), 'NOTIFY_FROM_EMAIL'),
    ).toBe('ok');
  });

  it('advises, without failing, when production disables geocoding or cannot review feedback', () => {
    const result = classify({ ...PRODUCTION, DISABLE_GEOCODING: '1' }, 'production');
    expect(result.ok).toBe(true);
    expect(result.rows.find((row) => row.name === 'DISABLE_GEOCODING')?.note).toMatch(/map pin/);
    expect(result.rows.find((row) => row.name === 'FEEDBACK_REVIEW_TOKEN')?.note).toMatch(/unset/);
    expect(classify({ DISABLE_GEOCODING: '1' }, 'local').rows.find((row) => row.name === 'DISABLE_GEOCODING')?.note).toBeNull();
  });

  it('never puts a value into a row or a failure message', () => {
    const secret = 'SECRET-VALUE-THAT-MUST-NOT-LEAK';
    const result = classify(
      { DATABASE_URL: secret, NOTIFY_FROM_EMAIL: secret, SUPPORT_EMAIL: secret, FEEDBACK_REVIEW_TOKEN: secret },
      'production',
    );
    const text = JSON.stringify(result);
    expect(text).not.toContain(secret);
  });

  it('refuses an unknown environment', () => {
    expect(() => classify({}, 'staging' as never)).toThrow(/unknown environment/);
  });
});

describe('parseDotenv', () => {
  it('reads the shapes .env.example and `vercel env pull` write', () => {
    const parsed = parseDotenv(
      [
        '# comment',
        '',
        'DATABASE_URL=libsql://example.turso.io',
        'DATABASE_AUTH_TOKEN=""',
        "RESEND_API_KEY='re_123'  # trailing comment",
        'export NOTIFY_FROM_EMAIL = "Find My Doggo <noreply@example.com>"',
        'GEOCODER_USER_AGENT=find-my-doggo (ops@example.com) # contact',
        'FEEDBACK_REVIEW_TOKEN=',
        'not a valid line',
      ].join('\n'),
    );
    expect(parsed).toEqual({
      DATABASE_URL: 'libsql://example.turso.io',
      DATABASE_AUTH_TOKEN: '',
      RESEND_API_KEY: 're_123',
      NOTIFY_FROM_EMAIL: 'Find My Doggo <noreply@example.com>',
      GEOCODER_USER_AGENT: 'find-my-doggo (ops@example.com)',
      FEEDBACK_REVIEW_TOKEN: '',
    });
  });

  it('handles Windows line endings', () => {
    expect(parseDotenv('A=1\r\nB=2\r\n')).toEqual({ A: '1', B: '2' });
  });
});

describe('mergeEnv', () => {
  it('lets .env.local override .env and the process environment override both', () => {
    const merged = mergeEnv(
      [
        { name: '.env', text: 'A=env\nB=env\nC=env' },
        { name: '.env.local', text: 'B=local\nC=local' },
      ],
      { C: 'process', D: undefined },
    );
    expect(merged).toEqual({ A: 'env', B: 'local', C: 'process' });
  });
});
