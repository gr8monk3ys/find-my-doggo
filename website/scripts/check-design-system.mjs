#!/usr/bin/env node
/* global console, process */
/**
 * check-design-system.mjs — make DESIGN.md fail the build the way TypeScript does.
 *
 * DESIGN.md (the Lost-Dog Noticeboard) documents named rules: The One Pen
 * Rule, The Flat Paper Rule, The Two Sheets Rule, The Serif Speaks Rule, …
 * Prose does not fail CI, so the rules that are mechanically checkable are
 * checked here. Zero dependencies, plain Node, one pass over src/**\/*.tsx
 * plus a look at src/app/globals.css.
 *
 *   node scripts/check-design-system.mjs          human-readable report
 *   node scripts/check-design-system.mjs --json   machine output
 *
 * Exit 0 when clean, 1 when any rule fires.
 *
 * Two kinds of rule live here. Hard rules fail on the first hit. The legacy
 * ratchet counts retired names and fails only if a count GROWS; it is how a
 * rule is introduced to a codebase that does not yet obey it. The notebook
 * landed in two PRs: the first recorded the orange identity's leftovers as
 * baselines, the second took every entry to zero and deleted it, so LEGACY is
 * empty today and every rule below is hard. Keep the mechanism: the next
 * retired name goes in LEGACY with its count, and leaves when it reaches zero.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const GLOBALS_CSS = join(SRC, 'app', 'globals.css');

/* ------------------------------------------------------------------ policy */

/**
 * Every Tailwind hue is off-system. DESIGN.md → Colors → The One Pen Rule:
 * colour goes through the tokens, and status goes through text-destructive /
 * text-success / text-info — never `red-500`. Gray, orange, red, green and
 * blue were ratcheted while the orange pages were still standing and joined
 * this list when the pages PR took their counts to zero.
 */
const PALETTE_FAMILIES = [
  'slate',
  'gray',
  'zinc',
  'neutral',
  'stone',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'sky',
  'blue',
  'indigo',
  'violet',
  'purple',
  'fuchsia',
  'pink',
  'rose',
];

const PALETTE_PREFIXES =
  'bg|text|border|from|to|via|ring|shadow|placeholder|divide|outline|fill|stroke|decoration|accent|caret';

/**
 * Documented exemptions. One entry per exemption, one line saying WHY it is
 * data (or a sanctioned singleton) rather than styling. Changing what is
 * allowed is a one-line edit here — never a change to a rule's regex.
 *
 *   rule   which rule the exemption applies to
 *   file   repo-relative path (from website/), forward slashes
 *   block  optional: only inside this named declaration (`const NAME = ...`)
 *   lines  optional: only these 1-based line numbers
 *   limit  optional: exempt at most this many hits
 */
const ALLOWLIST = [
  {
    rule: 'flat-paper',
    file: 'src/components/Navbar.tsx',
    limit: 1,
    // DESIGN.md → Elevation → The Two Sheets Rule: the header sheet is one of the two sanctioned shadows.
    why: 'the sticky header sheet, one of the two sanctioned shadows',
  },
  {
    rule: 'one-glass',
    file: 'src/components/Navbar.tsx',
    limit: 1,
    // DESIGN.md → Shapes: glass is for chrome that sits over itself; the header is the instance.
    why: 'the sticky header is the one glass surface',
  },
];

/**
 * The legacy ratchet. Each entry is a retired name; `baseline` is how many
 * times it appeared when the rule was introduced. A count above baseline
 * fails. Lower the baseline in the same PR that removes call sites, and
 * delete the entry at zero — at which point the hard rule named in `then`
 * (if any) starts running. Hits inside an ALLOWLIST entry for the `then`
 * rule are not counted.
 *
 *   { name: 'retired-name', pattern: /…/g, baseline: N, then: 'rule' }
 *
 * Empty since the pages PR (2026-10-13). The foundation PR had recorded
 * brand-orange 57, neutral-grey 95, status-hue 40, raw-white 24, hex-literal
 * 12, shadow 6, gradient-utility 1, emoji 8 and status-pill 3; the pages PR
 * took each to zero and the hard rules palette, raw-white, hex-literal,
 * flat-paper, no-gradient, no-emoji and status-pill now cover them.
 */
const LEGACY = [];

const RULES = {
  palette: {
    title: 'Hardcoded Tailwind palette utilities',
    doc: 'DESIGN.md → Colors → The One Pen Rule. Route every colour through the tokens; status is text-destructive / text-success / text-info.',
  },
  'raw-white': {
    title: 'Raw white or black',
    doc: 'DESIGN.md → Colors → The Tinted Paper Rule: a surface is paper at a tint (bg-background / bg-card / bg-muted), never white; text on the ink is text-primary-foreground.',
  },
  'hex-literal': {
    title: 'Hex colour literal in markup',
    doc: 'DESIGN.md → Colors: every colour is a token in globals.css. A one-off hex in a className is a second palette.',
  },
  'flat-paper': {
    title: 'Shadow on a content surface',
    doc: "DESIGN.md → Elevation → The Flat Paper Rule and The Two Sheets Rule: only the header sheet and cta-primary's ledge cast a shadow.",
  },
  'no-gradient': {
    title: 'Gradient fill or text',
    doc: 'DESIGN.md → Colors → The One Pen Rule: ink marks action and emphasis, never area. No gradient anywhere.',
  },
  'one-glass': {
    title: 'backdrop-blur outside the header',
    doc: 'DESIGN.md → Shapes: glass is for chrome that sits over itself, not for content.',
  },
  'serif-speaks': {
    title: 'Display font outside a heading',
    doc: 'DESIGN.md → Typography → The Serif Speaks Rule: Fraunces on h1–h6, the type-scale utilities and the wordmark only. Mark a deliberate exception with data-voice="display".',
  },
  'tiny-font': {
    title: 'Literal font size below the 12px label step',
    doc: 'DESIGN.md → Typography → Label: the wall label is the only thing under 12px, and it is a utility, not a literal.',
  },
  'no-entrance': {
    title: 'Content animates itself in',
    doc: 'DESIGN.md → Motion: content does not animate itself in. Hover, focus and loading indicators move; the page does not.',
  },
  'no-emoji': {
    title: 'Emoji as an icon, logo or illustration',
    doc: "DESIGN.md → Do's and Don'ts: no emoji as icons, logos or empty-state art. The mark, wall labels and honest empty states do that work.",
  },
  'status-pill': {
    title: 'A .status-{lost,found,reunited} pill',
    doc: 'DESIGN.md → Colors → The Status Label Rule: status is <StatusBadge>, a label-mono in the signal token, never a pill.',
  },
  'css-gradient': {
    title: 'Gradient in globals.css',
    doc: 'DESIGN.md → Colors → The One Pen Rule: no gradient anywhere. The paper grain is an SVG noise data URI, not a gradient.',
  },
  'css-shadow': {
    title: 'box-shadow in globals.css outside cta-primary',
    doc: 'DESIGN.md → Elevation → The Two Sheets Rule: the only box-shadow in the stylesheet is the primary button\'s 1px ledge. The header sheet lives in Navbar.tsx.',
  },
  'legacy-ratchet': {
    title: 'A retired name came back',
    doc: 'scripts/check-design-system.mjs → LEGACY: counts may only fall. Remove the new use, or lower the baseline in the PR that removes others.',
  },
};

/* ------------------------------------------------------------------- files */

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (entry.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const cache = new Map();
function read(absPath) {
  let hit = cache.get(absPath);
  if (!hit) {
    const text = readFileSync(absPath, 'utf8');
    hit = { text, lines: text.split('\n') };
    cache.set(absPath, hit);
  }
  return hit;
}

// Forward slashes on every platform: ALLOWLIST entries are written with "/",
// and on Windows `relative()` returns "\".
const rel = (absPath) => relative(ROOT, absPath).split('\\').join('/');

/* --------------------------------------------------------------- allowlist */

/**
 * Line range [start, end] of `const NAME = ...` / `function NAME(...)`, found by
 * bracket matching. For a `const` the count starts at the `=` so a multi-line
 * type annotation does not close the block early; for a `function` it starts
 * at the declaration line, so the parameter list balances out.
 */
function blockRange(lines, name) {
  const head = new RegExp(`^\\s*(?:export\\s+)?(?:async\\s+)?(?:const|let|var|function)\\s+${name}\\b`);
  const start = lines.findIndex((line) => head.test(line));
  if (start === -1) return null;
  const isBinding = /^\s*(?:export\s+)?(?:const|let|var)\b/.test(lines[start]);

  let depth = 0;
  let counting = !isBinding;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (!counting) {
        if (ch === '=' && !'=><!'.includes(line[c + 1] ?? '') && !'=><!'.includes(line[c - 1] ?? '')) counting = true;
        continue;
      }
      if (ch === '{' || ch === '(' || ch === '[') depth++;
      else if (ch === '}' || ch === ')' || ch === ']') depth--;
    }
    if (counting && depth <= 0 && i > start) return [start + 1, i + 1];
    if (counting && depth <= 0 && i === start && /[)}\]]/.test(line)) return [start + 1, i + 1];
  }
  return [start + 1, lines.length];
}

const rangeCache = new Map();
const used = new Map();

function take(entry) {
  const count = (used.get(entry) ?? 0) + 1;
  used.set(entry, count);
  if (entry.limit === undefined) return entry;
  return count <= entry.limit ? entry : null;
}

function isAllowed(rule, file, line, lines) {
  for (const entry of ALLOWLIST) {
    if (entry.rule !== rule || entry.file !== file) continue;
    if (entry.lines) {
      if (entry.lines.includes(line)) return take(entry);
      continue;
    }
    if (entry.block) {
      const key = `${file}::${entry.block}`;
      if (!rangeCache.has(key)) rangeCache.set(key, blockRange(lines, entry.block));
      const range = rangeCache.get(key);
      if (range && line >= range[0] && line <= range[1]) return take(entry);
      continue;
    }
    return take(entry);
  }
  return null;
}

/* ------------------------------------------------------------------- utils */

function* matchLines(lines, regex) {
  for (let i = 0; i < lines.length; i++) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(lines[i])) !== null) {
      yield { line: i + 1, match: m[0], text: lines[i] };
      if (m[0] === '') regex.lastIndex++;
    }
  }
}

const snippet = (text) => text.trim().replace(/\s+/g, ' ').slice(0, 118);

/* ------------------------------------------------------------------- rules */

const violations = [];
function report(rule, file, line, text) {
  violations.push({ rule, file, line, snippet: snippet(text) });
}

const srcFiles = walk(SRC);
const activeHardRules = new Set(
  Object.keys(RULES).filter((rule) => !LEGACY.some((entry) => entry.then === rule && entry.baseline > 0)),
);

function scan(rule, re, { transform } = {}) {
  if (!activeHardRules.has(rule)) return;
  for (const abs of srcFiles) {
    const file = rel(abs);
    const { lines } = read(abs);
    for (const hit of matchLines(lines, re)) {
      const keep = transform ? transform(hit) : hit.match;
      if (!keep) continue;
      if (isAllowed(rule, file, hit.line, lines)) continue;
      report(rule, file, hit.line, `${keep}  —  ${hit.text}`);
    }
  }
}

// palette — The One Pen Rule.
scan('palette', new RegExp(`\\b(?:${PALETTE_PREFIXES})-(?:${PALETTE_FAMILIES.join('|')})-[0-9]{2,3}\\b`, 'g'));

// raw-white — The Tinted Paper Rule. `bg-white` is never paper.
scan('raw-white', new RegExp(`\\b(?:${PALETTE_PREFIXES})-(?:white|black)\\b`, 'g'));

// hex-literal — a `[#abc123]` arbitrary colour in a className is a second palette.
scan('hex-literal', /\[#[0-9a-fA-F]{3,8}\]/g);

// flat-paper — The Flat Paper Rule and The Two Sheets Rule.
scan('flat-paper', /(?<![\w-])(?:[\w-]+:)*shadow-(?:2xs|xs|sm|md|lg|xl|2xl|\[[^\]]*\])(?![\w-])/g);

// no-gradient — utilities and raw CSS functions in markup.
scan(
  'no-gradient',
  /(?<![\w-])(?:[\w-]+:)*(?:bg-gradient-to-[a-z]+|bg-linear-|bg-radial|bg-conic)[\w-]*|(?:linear|radial|conic)-gradient\(/g,
);

// one-glass — the header is the one glass surface.
scan('one-glass', /(?<![\w-])(?:[\w-]+:)*backdrop-blur(?:-[\w]+)?(?![\w-])/g);

// serif-speaks — `font-display` on anything that is not a heading.
scan('serif-speaks', /<([A-Za-z][\w.]*)\b[^>]*\bfont-display\b/g, {
  transform(hit) {
    const tag = hit.match.match(/^<([A-Za-z][\w.]*)/)[1];
    // h1–h6, and any *Title primitive, which renders a heading.
    if (/^h[1-6]$/.test(tag) || /Title$/.test(tag)) return null;
    if (/data-voice=["']display["']/.test(hit.text)) return null;
    return `<${tag}> font-display`;
  },
});

// tiny-font — literal font sizes below the 12px label step.
scan('tiny-font', /text-\[([0-9]+(?:\.[0-9]+)?)px\]/g, {
  transform(hit) {
    return Number(hit.match.match(/([0-9.]+)px/)[1]) < 12 ? hit.match : null;
  },
});

// no-entrance — framer-motion-style mount reveals and entrance keyframes by name.
scan('no-entrance', /initial=\{\{\s*opacity:\s*0/g);
scan(
  'no-entrance',
  /(?<![\w-])(?:[\w-]+:)*animate-(?:fade-in(?:-up|-down)?|slide-in-[\w-]+|glow-pulse|shimmer|marquee)(?![\w-])/g,
);

// no-emoji — pictographs in markup. Typographic marks (· — ← →) are not
// Extended_Pictographic and pass.
scan('no-emoji', /\p{Extended_Pictographic}/gu);

// status-pill — the retired .status-{lost,found,reunited} classes.
scan('status-pill', /\bstatus-(?:lost|found|reunited)\b/g);

// css-gradient / css-shadow — the stylesheet itself. The paper grain is a
// feTurbulence data URI and contains no `gradient(`; the only box-shadow
// allowed is inside the `cta-primary` utility (its ledge, and `none` when
// disabled). `box-shadow: none` anywhere is a removal, not a shadow.
{
  const css = read(GLOBALS_CSS);
  const file = rel(GLOBALS_CSS);
  const ctaRange = (() => {
    const start = css.lines.findIndex((l) => /^@utility cta-primary\b/.test(l));
    if (start === -1) return null;
    let depth = 0;
    for (let i = start; i < css.lines.length; i++) {
      for (const ch of css.lines[i]) {
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
      }
      if (depth === 0 && i > start) return [start + 1, i + 1];
    }
    return null;
  })();
  for (const hit of matchLines(css.lines, /(?:linear|radial|conic)-gradient\(/g)) {
    report('css-gradient', file, hit.line, `${hit.match}  —  ${hit.text}`);
  }
  for (const hit of matchLines(css.lines, /box-shadow\s*:\s*[^;]+/g)) {
    if (/^box-shadow\s*:\s*none\b/.test(hit.match)) continue;
    if (ctaRange && hit.line >= ctaRange[0] && hit.line <= ctaRange[1]) continue;
    report('css-shadow', file, hit.line, `${hit.match}  —  ${hit.text}`);
  }
}

// legacy-ratchet — counts may only fall.
for (const entry of LEGACY) {
  let count = 0;
  for (const abs of srcFiles) {
    const file = rel(abs);
    const { lines } = read(abs);
    for (const hit of matchLines(lines, entry.pattern)) {
      if (entry.then && isAllowed(entry.then, file, hit.line, lines)) continue;
      count++;
    }
  }
  entry.count = count;
  if (count > entry.baseline) {
    report('legacy-ratchet', 'src/', 0, `${entry.name}: ${count} uses, baseline ${entry.baseline}`);
  }
}

/* ------------------------------------------------------------------ output */

const order = Object.keys(RULES);
violations.sort(
  (a, b) => order.indexOf(a.rule) - order.indexOf(b.rule) || a.file.localeCompare(b.file) || a.line - b.line,
);

if (process.argv.includes('--json')) {
  const byRule = Object.fromEntries(order.map((r) => [r, violations.filter((v) => v.rule === r).length]));
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: violations.length === 0,
        filesScanned: srcFiles.length,
        total: violations.length,
        rules: order,
        byRule,
        violations,
        legacy: LEGACY.map(({ name, baseline, count, then }) => ({ name, baseline, count, then })),
        allowlist: ALLOWLIST.map((entry) => ({
          rule: entry.rule,
          file: entry.file,
          block: entry.block,
          lines: entry.lines,
          limit: entry.limit,
          why: entry.why,
          applied: used.get(entry) ?? 0,
        })),
      },
      null,
      2,
    )}\n`,
  );
  process.exit(violations.length === 0 ? 0 : 1);
}

if (violations.length === 0) {
  const ratchet = LEGACY.filter((e) => e.baseline > 0);
  console.log(`design-system: OK — ${srcFiles.length} .tsx files + globals.css, 0 violations`);
  if (ratchet.length) {
    console.log(`   legacy ratchet: ${ratchet.map((e) => `${e.name} ${e.count}/${e.baseline}`).join(', ')}`);
  }
  process.exit(0);
}

console.log('');
console.log(`design-system: ${violations.length} violation(s) across ${srcFiles.length} .tsx files + globals.css`);
for (const rule of order) {
  const hits = violations.filter((v) => v.rule === rule);
  if (hits.length === 0) continue;
  console.log('');
  console.log(`── ${RULES[rule].title}  (${hits.length})`);
  for (const hit of hits) console.log(`   ${hit.file}:${hit.line}  ${hit.snippet}`);
  console.log(`   → ${RULES[rule].doc}`);
}
console.log('');
console.log('Summary:');
for (const rule of order) {
  const count = violations.filter((v) => v.rule === rule).length;
  console.log(`   ${String(count).padStart(3)}  ${rule}`);
}
console.log(`   ${String(violations.length).padStart(3)}  total`);
console.log('');
console.log(
  `Genuine data and sanctioned singletons belong in ALLOWLIST at the top of ${rel(
    fileURLToPath(import.meta.url),
  )} — one entry, one reason. Retired names are counted in LEGACY and may only fall.`,
);
process.exit(1);
