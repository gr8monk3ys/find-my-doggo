/**
 * Every text/ground pair the notebook uses must clear WCAG AA (4.5:1) in both
 * themes, measured from the HSL triplets in src/app/globals.css rather than
 * trusted from DESIGN.md. A future lighter ink cannot silently break the
 * small-text sites that paint in `text-primary`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const CSS = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

function block(selector: string): Record<string, string> {
  const m = CSS.match(new RegExp(`\\n\\s*${selector.replace('.', '\\.')}\\s*\\{([^}]+)\\}`));
  if (!m) throw new Error(`no ${selector} block`);
  const out: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^\s*(--[\w-]+):\s*([^;]+);/);
    if (kv) out[kv[1]] = kv[2].trim();
  }
  return out;
}

function hslToRgb(triplet: string): [number, number, number] {
  const [h, s, l] = triplet.replace(/%/g, '').split(/\s+/).map(Number);
  const S = s / 100;
  const L = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = S * Math.min(L, 1 - L);
  const f = (n: number) => L - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255)) as [number, number, number];
}

const lum = ([r, g, b]: [number, number, number]) => {
  const c = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

export const contrast = (a: string, b: string) => {
  const [l1, l2] = [lum(hslToRgb(a)), lum(hslToRgb(b))].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

const PAIRS: Array<[string, string, number]> = [
  ['--foreground', '--background', 4.5],
  ['--foreground', '--muted', 4.5],
  ['--foreground', '--accent', 4.5],
  ['--card-foreground', '--card', 4.5],
  ['--muted-foreground', '--background', 4.5],
  ['--muted-foreground', '--card', 4.5],
  ['--muted-foreground', '--muted', 4.5],
  ['--primary', '--background', 4.5],
  ['--primary', '--card', 4.5],
  ['--primary', '--muted', 4.5],
  ['--primary', '--accent', 4.5],
  ['--primary-foreground', '--primary', 4.5],
  ['--secondary-foreground', '--secondary', 4.5],
  ['--destructive', '--background', 4.5],
  ['--destructive', '--card', 4.5],
  ['--destructive-foreground', '--destructive', 4.5],
  ['--success', '--background', 4.5],
  ['--success', '--card', 4.5],
  ['--warning', '--background', 4.5],
  ['--info', '--background', 4.5],
  ['--info', '--card', 4.5],
  ['--accent-foreground', '--accent', 4.5],
  ['--popover-foreground', '--popover', 4.5],
  ['--ring', '--background', 3], // the focus outline sits on the page, 3:1 is the non-text floor
  ['--border', '--background', 1.15], // a hairline only has to be visible
];

for (const [theme, selector] of [
  ['light', ':root'],
  ['dark', '.dark'],
] as const) {
  describe(`${theme} tokens`, () => {
    const t = block(selector);
    for (const [fg, bg, floor] of PAIRS) {
      it(`${fg} on ${bg} ≥ ${floor}:1`, () => {
        expect(t[fg]).toBeDefined();
        expect(t[bg]).toBeDefined();
        expect(contrast(t[fg].split('/')[0], t[bg].split('/')[0])).toBeGreaterThanOrEqual(floor);
      });
    }
  });
}

describe('the stationery', () => {
  it('is the shared paper and night', () => {
    const light = block(':root');
    const dark = block('.dark');
    expect(light['--background']).toBe('38 25% 97%');
    expect(light['--foreground']).toBe('210 15% 12%');
    expect(light['--border']).toBe('30 18% 86%');
    expect(dark['--background']).toBe('220 15% 8%');
    expect(dark['--foreground']).toBe('0 0% 98%');
    expect(dark['--border']).toBe('220 10% 18%');
  });

  it('writes in Terracotta in both themes', () => {
    expect(block(':root')['--primary']).toBe('16 60% 40%');
    expect(block('.dark')['--primary']).toBe('18 70% 72%');
    expect(block(':root')['--ring']).toBe(block(':root')['--primary']);
    expect(block('.dark')['--ring']).toBe(block('.dark')['--primary']);
  });

  it('has no colour literals outside the paper grain', () => {
    // Comments may quote a hex to explain a measurement; declarations may not.
    const declarations = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    const offenders = declarations
      .split('\n')
      .filter((line) => !line.includes('data:image/svg+xml') && /#[0-9a-fA-F]{3,8}\b|\brgba?\(/.test(line));
    expect(offenders).toEqual([]);
  });

  it('never defines spacing tokens in @theme', () => {
    expect(CSS).not.toMatch(/--spacing-(?:xs|sm|md|lg|xl|2xl|3xl|4xl)\s*:/);
  });

  it('content never animates itself in', () => {
    for (const name of ['fade-in-up', 'fade-in', 'slide-in-left', 'slide-in-right', 'glow-pulse', 'shimmer', 'marquee']) {
      expect(CSS).not.toContain(`@keyframes ${name}`);
    }
  });
});
