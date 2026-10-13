/**
 * The static brand assets are committed output of scripts/generate-brand.mjs.
 * These checks keep them present, well-formed, on-system (no gradient, no
 * filter, no font) and in agreement with the React mark.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { MARK_PATH } from '@/components/brand/Logo';

const ROOT = process.cwd();
const PUBLIC = join(ROOT, 'public');
const BRAND = join(PUBLIC, 'brand');

const SVGS = [
  'mark.svg',
  'mark-dark.svg',
  'mark-mono.svg',
  'logo-horizontal.svg',
  'logo-horizontal-dark.svg',
  'logo-stacked.svg',
  'logo-stacked-dark.svg',
];

const PNGS: Array<[string, number]> = [
  ['favicon-16x16.png', 16],
  ['favicon-32x32.png', 32],
  ['apple-touch-icon.png', 180],
  ['android-chrome-192x192.png', 192],
  ['android-chrome-512x512.png', 512],
  ['android-chrome-512x512-maskable.png', 512],
];

function pngSize(file: string) {
  const buf = readFileSync(file);
  // PNG: 8-byte signature, then the IHDR chunk: length(4) "IHDR"(4) width(4) height(4).
  expect(buf.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  expect(buf.subarray(12, 16).toString('ascii')).toBe('IHDR');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

describe('the mark', () => {
  it('is one evenodd path on a 24-unit grid: the plate, then the tag', () => {
    expect(MARK_PATH.startsWith('M0 0H24V24H0Z')).toBe(true);
    // Exactly two subpaths: the square plate and the bone tag.
    expect(MARK_PATH.match(/Z/g)?.length).toBe(2);
  });

  it('is the same path in scripts/generate-brand.mjs', () => {
    const script = readFileSync(join(ROOT, 'scripts/generate-brand.mjs'), 'utf8');
    const m = script.match(/const MARK_PATH =\s*'([^']+)'/);
    expect(m?.[1]).toBe(MARK_PATH);
  });
});

describe('brand assets', () => {
  it.each(SVGS)('public/brand/%s is a plain SVG with no gradient, filter or font', (name) => {
    const file = join(BRAND, name);
    expect(existsSync(file)).toBe(true);
    const text = readFileSync(file, 'utf8');
    expect(text).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+">/);
    expect(text.trimEnd()).toMatch(/<\/svg>$/);
    expect(text).not.toMatch(/linearGradient|radialGradient|<filter|font-family|@font-face|<text/);
    expect(text).not.toMatch(/NaN/);
  });

  it('the mark files carry the same path as <LogoMark>', () => {
    for (const name of ['mark.svg', 'mark-dark.svg', 'mark-mono.svg']) {
      const text = readFileSync(join(BRAND, name), 'utf8');
      const path = text.match(/<path ([^>]*)\/>/)?.[1] ?? '';
      expect(path).toContain(`d="${MARK_PATH}"`);
      expect(path).toContain('fill-rule="evenodd"');
    }
    expect(readFileSync(join(BRAND, 'mark.svg'), 'utf8')).toContain('#a34929');
    expect(readFileSync(join(BRAND, 'mark-dark.svg'), 'utf8')).toContain('#eaa486');
    expect(readFileSync(join(BRAND, 'mark-mono.svg'), 'utf8')).toContain('fill="#000"');
  });

  it('the lockups set the wordmark as outlines in ink with Doggo in Terracotta', () => {
    const light = readFileSync(join(BRAND, 'logo-horizontal.svg'), 'utf8');
    expect(light).toContain('fill="#1a1f23"');
    expect(light.match(/fill="#a34929"/g)?.length).toBe(2); // the mark and "Doggo"
    const dark = readFileSync(join(BRAND, 'logo-stacked-dark.svg'), 'utf8');
    expect(dark).toContain('fill="#fafafa"');
    expect(dark.match(/fill="#eaa486"/g)?.length).toBe(2);
  });

  it('ships a README with the rules', () => {
    const readme = readFileSync(join(BRAND, 'README.md'), 'utf8');
    expect(readme).toMatch(/clear space/i);
    expect(readme).toMatch(/16px/);
    expect(readme).toMatch(/96px/);
    expect(readme).toMatch(/do not.*rotate/i);
  });

  it.each(PNGS)('public/%s is a %ipx square PNG', (name, size) => {
    const file = join(PUBLIC, name);
    expect(existsSync(file)).toBe(true);
    expect(pngSize(file)).toEqual({ width: size, height: size });
  });

  it('src/app/favicon.ico holds the 16, 32 and 48 sizes', () => {
    const buf = readFileSync(join(ROOT, 'src/app/favicon.ico'));
    // ICONDIR: reserved(2)=0, type(2)=1, count(2); then 16-byte entries with width, height.
    expect(buf.readUInt16LE(0)).toBe(0);
    expect(buf.readUInt16LE(2)).toBe(1);
    const count = buf.readUInt16LE(4);
    const sizes = Array.from({ length: count }, (_, i) => buf.readUInt8(6 + i * 16));
    expect(sizes.sort((a, b) => a - b)).toEqual([16, 32, 48]);
  });

  it('the manifest points at the tag on paper in Terracotta', () => {
    const manifest = readFileSync(join(ROOT, 'src/app/manifest.ts'), 'utf8');
    expect(manifest).toContain("theme_color: '#a34929'");
    expect(manifest).toContain("background_color: '#f9f8f5'");
    expect(manifest).toContain('/android-chrome-512x512.png');
    expect(manifest).toContain('/android-chrome-512x512-maskable.png');
  });
});
