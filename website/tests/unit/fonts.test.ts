/**
 * Fonts are self-hosted and never fetched at build time. next/font/local
 * reads the files from node_modules/@fontsource*, so the check is that each
 * referenced file exists and that nothing under src/ imports next/font/google.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const FONTS_TS = readFileSync(join(ROOT, 'src/lib/fonts.ts'), 'utf8');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
  });
}

describe('self-hosted fonts', () => {
  it('references woff2 files that exist on disk', () => {
    const srcs = [...FONTS_TS.matchAll(/(?:src|path):\s*'([^']+\.woff2)'/g)].map((m) => m[1]);
    expect(srcs.length).toBeGreaterThanOrEqual(5);
    for (const src of srcs) {
      expect({ src, exists: existsSync(join(ROOT, 'src/lib', src)) }).toEqual({ src, exists: true });
    }
  });

  it('exposes the three voices as CSS variables the theme reads', () => {
    const css = readFileSync(join(ROOT, 'src/app/globals.css'), 'utf8');
    for (const v of ['--font-fraunces', '--font-instrument-sans', '--font-plex-mono']) {
      expect(FONTS_TS).toContain(`variable: '${v}'`);
      expect(css).toContain(`var(${v})`);
    }
  });

  it('keeps the mono label from swapping and the display face off the preload list', () => {
    expect(FONTS_TS).toMatch(/display:\s*'optional'/);
    expect(FONTS_TS.match(/preload:\s*false/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('never imports next/font/google anywhere under src/', () => {
    const offenders = walk(join(ROOT, 'src')).filter((f) => readFileSync(f, 'utf8').includes('next/font/google'));
    expect(offenders).toEqual([]);
  });
});
