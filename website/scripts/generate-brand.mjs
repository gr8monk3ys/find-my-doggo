#!/usr/bin/env node
/* global console, process */
/**
 * generate-brand.mjs — every static brand asset, from one path.
 *
 *   npm run brand:generate        (node scripts/generate-brand.mjs, from website/)
 *
 * The mark is the collar tag: a square Terracotta plate with a bone-shaped
 * dog tag cut out of it (DESIGN.md → Components → Mark and Wordmark). This
 * script is the source of truth for everything under public/brand/, the
 * favicons and app icons, and docs/brand/lockups.png at the repo root; the
 * PNGs are committed so the build never has to run it.
 *
 * Writes:
 *   public/brand/mark.svg, mark-dark.svg, mark-mono.svg
 *   public/brand/logo-horizontal{,-dark}.svg, logo-stacked{,-dark}.svg
 *     (wordmark converted to outlines with opentype.js — no font reference)
 *   public/brand/README.md
 *   src/app/favicon.ico (16+32+48)  — Next serves app/favicon.ico itself
 *   public/favicon-16x16.png, favicon-32x32.png
 *   public/apple-touch-icon.png (180), android-chrome-192x192.png,
 *     android-chrome-512x512.png, android-chrome-512x512-maskable.png
 *   ../docs/brand/lockups.png (a 2x contact sheet for PRs and the README)
 *
 * MARK_PATH must equal the constant in src/components/brand/Logo.tsx;
 * tests/unit/brand-assets.test.ts fails when the two drift.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import pngToIco from 'png-to-ico';

// opentype.js ships CJS; createRequire keeps this file plain ESM.
const require = createRequire(import.meta.url);
const opentype = require('opentype.js');

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const BRAND = join(PUBLIC, 'brand');
const APP = join(ROOT, 'src', 'app');
const DOCS = join(ROOT, '..', 'docs', 'brand');
const FONT = join(ROOT, 'node_modules/@fontsource/fraunces/files/fraunces-latin-700-normal.woff');

/* ------------------------------------------------------------------ tokens */

// DESIGN.md → Colors. Literal because an SVG file has no CSS variables.
const TERRACOTTA = '#a34929';
const TERRACOTTA_NIGHT = '#eaa486';
const PAPER = '#f9f8f5';
const NIGHT = '#111317';
const INK = '#1a1f23';
const NIGHT_INK = '#fafafa';

/* -------------------------------------------------------------------- mark */

// The plate (first subpath) and the bone tag (second). With fill-rule evenodd
// the tag is a hole. Same string as Logo.tsx.
const MARK_PATH =
  'M0 0H24V24H0ZM9.284 9.9L14.716 9.9A2.9 2.9 0 1 1 19.228 12A2.9 2.9 0 1 1 14.716 14.1L9.284 14.1A2.9 2.9 0 1 1 4.772 12A2.9 2.9 0 1 1 9.284 9.9Z';
const TAG_PATH = MARK_PATH.slice(MARK_PATH.indexOf('M9.284'));
const MARK_UNITS = 24;

// Fraunces 700: sCapHeight 1400 / unitsPerEm 2000.
const CAP_HEIGHT = 0.7;
const TRACKING = -0.02;

const markPath = (fill) => `<path fill="${fill}" fill-rule="evenodd" d="${MARK_PATH}"/>`;

/** The mark alone, viewBox 0 0 24 24. The tag is transparent. */
function markSvg(fill) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_UNITS} ${MARK_UNITS}">${markPath(fill)}</svg>`;
}

/**
 * The mark with the tag filled (the favicon form). Outside the plate stays
 * transparent, but the tag is paper rather than a hole so the favicon reads
 * the same on a light and a dark tab strip.
 */
function faviconSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MARK_UNITS} ${MARK_UNITS}"><path fill="${PAPER}" d="${TAG_PATH}"/>${markPath(TERRACOTTA)}</svg>`;
}

/** The mark on a paper ground with `padding` (fraction of the side) around it. No transparency. */
function appIconSvg(padding) {
  const inner = 1 - padding * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"><rect width="1" height="1" fill="${PAPER}"/><g transform="translate(${padding} ${padding}) scale(${inner / MARK_UNITS})">${markPath(TERRACOTTA)}</g></svg>`;
}

/* ---------------------------------------------------------------- wordmark */

async function loadFont() {
  const buf = await readFile(FONT);
  // opentype.parse wants the exact ArrayBuffer slice; Buffer.buffer is the pool.
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/**
 * Serialise an opentype.js Path to SVG path data at two decimals. Not
 * `Path.toPathData`: opentype.js 2.0 memoises its rounding on the float's
 * fractional part and that cache hands back NaN for some sizes.
 */
function pathData(path) {
  const n = (v) => {
    if (!Number.isFinite(v)) throw new Error(`non-finite coordinate in wordmark path: ${v}`);
    return String(Math.round(v * 100) / 100);
  };
  let d = '';
  for (const c of path.commands) {
    if (c.type === 'M' || c.type === 'L') d += `${c.type}${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'Q') d += `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'C') d += `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
    else if (c.type === 'Z') d += 'Z';
    else throw new Error(`unknown path command ${c.type}`);
  }
  return d;
}

/**
 * "Find My Doggo" as two outlined paths, "Find My " and "Doggo", at
 * `fontSize` with the baseline at (x, y). The split falls on a space, so
 * kerning across it costs nothing.
 */
function wordmark(font, x, y, fontSize) {
  const opts = { kerning: true, letterSpacing: TRACKING };
  const lead = font.getPath('Find My ', x, y, fontSize, opts);
  const advance = font.getAdvanceWidth('Find My ', fontSize, opts);
  const accent = font.getPath('Doggo', x + advance, y, fontSize, opts);
  const a = lead.getBoundingBox();
  const b = accent.getBoundingBox();
  return {
    lead: pathData(lead),
    accent: pathData(accent),
    bbox: { x1: a.x1, y1: Math.min(a.y1, b.y1), x2: b.x2, y2: Math.max(a.y2, b.y2) },
  };
}

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * A lockup, drawn at mark size M. Horizontal: mark, a gap of M/2 (12px at the
 * component's default 24px), wordmark with cap height M. Stacked: mark above,
 * the same gap, wordmark centred beneath with cap height M/2. The viewBox is
 * tight around the ink.
 */
function lockupSvg(font, { variant, markFill, inkFill, accentFill }) {
  const M = 96;
  const GAP = M / 2;
  let markX, markY, wm;
  if (variant === 'horizontal') {
    const fontSize = M / CAP_HEIGHT;
    markX = 0;
    markY = 0;
    wm = wordmark(font, M + GAP, M, fontSize);
  } else {
    const cap = M / 2;
    const fontSize = cap / CAP_HEIGHT;
    const probe = wordmark(font, 0, 0, fontSize);
    const width = probe.bbox.x2 - probe.bbox.x1;
    markX = (width - M) / 2 + probe.bbox.x1;
    markY = 0;
    wm = wordmark(font, 0, M + GAP + cap, fontSize);
  }
  const x1 = Math.min(markX, wm.bbox.x1);
  const y1 = Math.min(markY, wm.bbox.y1);
  const x2 = Math.max(markX + M, wm.bbox.x2);
  const y2 = Math.max(markY + M, wm.bbox.y2);
  const scale = M / MARK_UNITS;
  return {
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r2(x1)} ${r2(y1)} ${r2(x2 - x1)} ${r2(y2 - y1)}">` +
      `<title>Find My Doggo</title>` +
      `<g transform="translate(${r2(markX)} ${r2(markY)}) scale(${r2(scale)})">${markPath(markFill)}</g>` +
      `<path fill="${inkFill}" d="${wm.lead}"/>` +
      `<path fill="${accentFill}" d="${wm.accent}"/>` +
      `</svg>`,
    width: r2(x2 - x1),
    height: r2(y2 - y1),
  };
}

/* ------------------------------------------------------------------ raster */

function png(svg, width, background) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
    ...(background ? { background } : {}),
  });
  return resvg.render().asPng();
}

const dataUri = (buf) => `data:image/png;base64,${buf.toString('base64')}`;

/**
 * docs/brand/lockups.png — a 2x contact sheet: the mark at 16/32/88, the two
 * lockups, by day and by night.
 */
function contactSheet(font) {
  const W = 1200;
  const H = 760;
  const rows = [
    { y: 0, bg: PAPER, mark: TERRACOTTA, ink: INK, label: INK, caption: 'PAPER · TERRACOTTA #A34929' },
    { y: H / 2, bg: NIGHT, mark: TERRACOTTA_NIGHT, ink: NIGHT_INK, label: NIGHT_INK, caption: 'NIGHT · TERRACOTTA #EAA486' },
  ];
  const parts = [];
  for (const row of rows) {
    parts.push(`<rect y="${row.y}" width="${W}" height="${H / 2}" fill="${row.bg}"/>`);
    let x = 48;
    const cy = row.y + 110;
    for (const size of [16, 32, 88]) {
      parts.push(
        `<image x="${x}" y="${cy - size / 2}" width="${size}" height="${size}" href="${dataUri(png(markSvg(row.mark), size, row.bg))}"/>`,
      );
      x += size + 32;
    }
    const horizontal = lockupSvg(font, { variant: 'horizontal', markFill: row.mark, inkFill: row.ink, accentFill: row.mark });
    const stacked = lockupSvg(font, { variant: 'stacked', markFill: row.mark, inkFill: row.ink, accentFill: row.mark });
    const hw = 460;
    const hh = (hw * horizontal.height) / horizontal.width;
    parts.push(
      `<image x="${x + 48}" y="${cy - hh / 2}" width="${hw}" height="${hh}" href="${dataUri(png(horizontal.svg, hw * 2, row.bg))}"/>`,
    );
    const sw = 220;
    const sh = (sw * stacked.height) / stacked.width;
    parts.push(
      `<image x="${x + 48 + hw + 80}" y="${row.y + 40}" width="${sw}" height="${sh}" href="${dataUri(png(stacked.svg, sw * 2, row.bg))}"/>`,
    );
    parts.push(
      `<text x="48" y="${row.y + H / 2 - 40}" font-family="ui-monospace, Menlo, monospace" font-size="13" letter-spacing="2" fill="${row.label}" opacity="0.6">${row.caption} · MARK 16 / 32 / 88 · HORIZONTAL · STACKED</text>`,
    );
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${parts.join('')}</svg>`;
  return png(svg, W * 2);
}

/* ------------------------------------------------------------------ readme */

function readme({ horizontal, stacked }) {
  return `# Find My Doggo brand assets

The collar tag: a square plate of Terracotta ink with a bone-shaped dog tag
cut out of it in paper. See \`DESIGN.md → Components → Mark and Wordmark\`.

Every file here is generated by \`npm run brand:generate\`
(\`scripts/generate-brand.mjs\`) from one path. Edit the script, not the files.

## Files

| File                                             | What                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| \`mark.svg\`                                       | The mark, Terracotta \`${TERRACOTTA}\`, 24×24 viewBox. The tag is a transparent hole. |
| \`mark-dark.svg\`                                  | The mark for night grounds, Terracotta \`${TERRACOTTA_NIGHT}\`.                       |
| \`mark-mono.svg\`                                  | Single-colour \`#000\` for engraving, stamps, one-ink print.                     |
| \`logo-horizontal.svg\` / \`-dark.svg\`              | Mark, 12px gap, wordmark; mark height = the wordmark's cap height.             |
| \`logo-stacked.svg\` / \`-dark.svg\`                 | Mark above, 12px gap, wordmark centred beneath at half the mark's height.      |
| \`../../src/app/favicon.ico\`, \`../favicon-{16x16,32x32}.png\` | The mark with the tag filled paper, so it reads on light and dark tab strips. |
| \`../apple-touch-icon.png\`                        | 180px, mark on paper with 12% padding, no transparency.                        |
| \`../android-chrome-{192x192,512x512}.png\`        | Mark on paper, 12% padding.                                                    |
| \`../android-chrome-512x512-maskable.png\`         | 22% padding, inside the maskable safe zone.                                    |
| \`../../../docs/brand/lockups.png\`                | A 2x contact sheet of everything above.                                        |

The lockup SVGs have the wordmark converted to outlines and reference no font.
In the app use \`<Logo>\` / \`<LogoMark>\` from \`src/components/brand/Logo.tsx\`
instead; the wordmark there is live text and the mark takes its ink from the
theme.

## Rules

- **Sizes.** The mark is 1:1. The lockups are drawn at mark = 96 units; the
  horizontal lockup is ${horizontal.width} × ${horizontal.height}, the stacked ${stacked.width} × ${stacked.height}.
- **Clear space** around any lockup is the bone's half-width: 0.3 × the mark's
  height, on every side.
- **Minimum size.** 16px for the mark alone, 96px wide for either lockup.
  Below that use the mark.
- **Colours.** Terracotta \`${TERRACOTTA}\` on paper \`${PAPER}\`; Terracotta \`${TERRACOTTA_NIGHT}\` on
  night \`${NIGHT}\`; the wordmark in Ink \`${INK}\` / \`${NIGHT_INK}\` with "Doggo" in the
  Terracotta of the ground. Monochrome: \`mark-mono.svg\`.
- **Do not** rotate, recolour, add shadows or gradients, round the corners,
  outline the plate, stretch the mark, or set the wordmark in another face.
`;
}

/* -------------------------------------------------------------------- main */

async function main() {
  await mkdir(BRAND, { recursive: true });
  await mkdir(DOCS, { recursive: true });
  const font = await loadFont();

  const lockups = {
    'logo-horizontal.svg': lockupSvg(font, { variant: 'horizontal', markFill: TERRACOTTA, inkFill: INK, accentFill: TERRACOTTA }),
    'logo-horizontal-dark.svg': lockupSvg(font, {
      variant: 'horizontal',
      markFill: TERRACOTTA_NIGHT,
      inkFill: NIGHT_INK,
      accentFill: TERRACOTTA_NIGHT,
    }),
    'logo-stacked.svg': lockupSvg(font, { variant: 'stacked', markFill: TERRACOTTA, inkFill: INK, accentFill: TERRACOTTA }),
    'logo-stacked-dark.svg': lockupSvg(font, {
      variant: 'stacked',
      markFill: TERRACOTTA_NIGHT,
      inkFill: NIGHT_INK,
      accentFill: TERRACOTTA_NIGHT,
    }),
  };
  const svgs = {
    'mark.svg': markSvg(TERRACOTTA),
    'mark-dark.svg': markSvg(TERRACOTTA_NIGHT),
    'mark-mono.svg': markSvg('#000'),
    ...Object.fromEntries(Object.entries(lockups).map(([name, { svg }]) => [name, svg])),
  };
  for (const [name, svg] of Object.entries(svgs)) {
    await writeFile(join(BRAND, name), `${svg}\n`);
  }
  await writeFile(
    join(BRAND, 'README.md'),
    readme({ horizontal: lockups['logo-horizontal.svg'], stacked: lockups['logo-stacked.svg'] }),
  );

  const favicon = faviconSvg();
  const pngs = {
    'favicon-16x16.png': png(favicon, 16),
    'favicon-32x32.png': png(favicon, 32),
    'apple-touch-icon.png': png(appIconSvg(0.12), 180),
    'android-chrome-192x192.png': png(appIconSvg(0.12), 192),
    'android-chrome-512x512.png': png(appIconSvg(0.12), 512),
    // Maskable safe zone is a circle of 80% diameter; a square inscribed in
    // it has a side of 0.8/√2 ≈ 0.566, so 22% padding keeps the plate inside.
    'android-chrome-512x512-maskable.png': png(appIconSvg(0.22), 512),
  };
  for (const [name, buf] of Object.entries(pngs)) {
    await writeFile(join(PUBLIC, name), buf);
  }
  // Next serves src/app/favicon.ico as /favicon.ico.
  await writeFile(join(APP, 'favicon.ico'), await pngToIco([png(favicon, 16), png(favicon, 32), png(favicon, 48)]));

  await writeFile(join(DOCS, 'lockups.png'), contactSheet(font));

  console.log(
    `brand: ${Object.keys(svgs).length} SVGs + README in public/brand, ${Object.keys(pngs).length} PNGs in public, src/app/favicon.ico, docs/brand/lockups.png`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
