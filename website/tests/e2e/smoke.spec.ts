import { type ConsoleMessage, expect, type Page, test } from '@playwright/test';

/**
 * Every public route renders, and the browser console stays clean while it
 * does. Hydration mismatches, a client component that throws, a CSP that
 * blocks a script: each shows up as a console error or an uncaught exception
 * long before a user notices anything, so this is the cheapest signal that a
 * production build is actually healthy.
 */
const ROUTES: { path: string; heading: string }[] = [
  { path: '/', heading: 'Help reunite lost dogs with their families' },
  { path: '/dogs', heading: 'Lost & found dogs' },
  { path: '/map', heading: 'Map' },
  { path: '/report', heading: 'Report a dog' },
  { path: '/contact', heading: 'Get in touch' },
  // Seeded by scripts/seed.mjs (CI runs `npm run seed` before the e2e job).
  { path: '/dogs/sample-luna', heading: 'Luna' },
];

/**
 * Console errors the smoke tolerates. Each entry names the reason: every one
 * is a third party being unreachable from the test runner, never app code.
 * Chrome reports a failed network fetch as a console error whose location is
 * the URL that failed, so the match is on that URL, not on the message text.
 */
const BENIGN: { reason: string; matches: (url: URL) => boolean }[] = [
  {
    reason: 'OpenStreetMap tile CDN unreachable (the map test asserts tile requests are made, not that they succeed)',
    matches: (url) => url.hostname === 'tile.openstreetmap.org' || url.hostname.endsWith('.tile.openstreetmap.org'),
  },
  {
    reason: 'Unsplash photo for a seeded listing unreachable through next/image',
    matches: (url) =>
      url.pathname === '/_next/image' && (url.searchParams.get('url') ?? '').startsWith('https://images.unsplash.com/'),
  },
];

function isBenign(message: ConsoleMessage): boolean {
  if (!/^Failed to load resource/.test(message.text())) return false;
  const location = message.location().url;
  if (!location) return false;
  try {
    const url = new URL(location);
    return BENIGN.some((entry) => entry.matches(url));
  } catch {
    return false;
  }
}

/** Collects console errors and uncaught exceptions from the moment it is attached. */
function watchConsole(page: Page): () => string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error' || isBenign(message)) return;
    const { url, lineNumber } = message.location();
    problems.push(`console.error: ${message.text()}${url ? ` (${url}:${lineNumber})` : ''}`);
  });
  page.on('pageerror', (error) => {
    problems.push(`pageerror: ${error.message}`);
  });
  return () => problems;
}

for (const { path, heading } of ROUTES) {
  test(`${path} renders with a clean console`, async ({ page }) => {
    const problems = watchConsole(page);

    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);

    // The map mounts client-side only; waiting for it means hydration ran and
    // any error it throws has had the chance to reach the console.
    if (path === '/map') await expect(page.locator('.leaflet-container')).toBeVisible();
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {
      // Tiles can trickle in for a while on a slow network; the console is what matters.
    });

    expect(problems(), `console problems on ${path}`).toEqual([]);
  });
}

test('/api/health is ok and describes the deployment', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body = await response.json();
  expect(body.status).toBe('ok');
  expect(body.database).toBe('reachable');
  expect(typeof body.databaseLatencyMs).toBe('number');
  expect(Number.isFinite(body.databaseLatencyMs)).toBe(true);

  // The exact values are environment-specific (feedback.spec.ts pins them for
  // the e2e environment); here the contract is the shape: every flag in
  // lib/features.ts is present and boolean, so scripts/smoke.mjs can print it.
  expect(Object.keys(body.features).sort()).toEqual(
    ['durableImageStorage', 'emailDelivery', 'feedbackReview', 'geocoding', 'hostedDatabase'].sort(),
  );
  for (const [flag, value] of Object.entries(body.features)) {
    expect(typeof value, flag).toBe('boolean');
  }
});

test('robots.txt and the sitemap are served and point at each other', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  const robotsText = await robots.text();
  expect(robotsText).toContain('Disallow: /api/');
  expect(robotsText).toMatch(/^Sitemap: .*\/sitemap\.xml$/m);

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  const sitemapText = await sitemap.text();
  for (const path of ['/dogs', '/map', '/report', '/contact', '/dogs/sample-luna']) {
    expect(sitemapText, path).toContain(`${path}</loc>`);
  }
});
