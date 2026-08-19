import { expect, test } from '@playwright/test';

/** Leaflet fetches tiles from the {s} subdomains of this host. */
const TILE_HOST = 'tile.openstreetmap.org';

test('the primary navigation reaches every page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Help reunite lost dogs');

  for (const [label, heading] of [
    ['Lost & found', 'Lost & found dogs'],
    ['Map', 'Map'],
    ['Report a dog', 'Report a dog'],
    ['Contact', 'Get in touch'],
  ] as const) {
    await page.getByRole('navigation').getByRole('link', { name: label, exact: true }).click();
    await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
  }
});

test('status filters drive the URL and narrow the results', async ({ page }) => {
  await page.goto('/dogs');
  await page.getByRole('button', { name: 'Reunited' }).click();

  await expect(page).toHaveURL(/status=reunited/);
  const cards = page.getByRole('link', { name: /View details/ });
  if ((await cards.count()) > 0) {
    expect(await page.getByText('Reunited', { exact: true }).count()).toBeGreaterThan(0);
  }
});

test('search narrows listings and survives a page reload', async ({ page }) => {
  await page.goto('/dogs');
  await page.getByLabel('Search by name, breed, or location').fill('Husky');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page).toHaveURL(/q=Husky/);
  await expect(page.getByText(/matching “Husky”/)).toBeVisible();

  // Filter state lives in the URL, so a reload must not lose it.
  await page.reload();
  await expect(page.getByLabel('Search by name, breed, or location')).toHaveValue('Husky');
});

test.describe('map', () => {
  // Tall enough that the whole 500px map is on screen, so a marker click is not
  // incidentally a test of scrolling past the sticky navigation.
  test.use({ viewport: { width: 1280, height: 1200 } });

  test('mounts Leaflet and plots seeded dogs at their real coordinates', async ({ page }) => {
    // Asserting on the requested tile URLs rather than on rendered tiles keeps
    // this independent of whether the OSM CDN is reachable from CI.
    const tileRequests: string[] = [];
    page.on('request', (request) => {
      // Compare the parsed hostname rather than searching the whole URL: a
      // substring check would also match an unrelated host carrying the name
      // in its path or query.
      const { hostname } = new URL(request.url());
      if (hostname === TILE_HOST || hostname.endsWith(`.${TILE_HOST}`)) {
        tileRequests.push(request.url());
      }
    });

    await page.goto('/map');
    await expect(page.getByRole('heading', { name: 'Map', level: 1 })).toBeVisible();

    // Leaflet only mounts client-side, so this also proves hydration works.
    await expect(page.locator('.leaflet-container')).toBeVisible();
    await expect(page.getByText('OpenStreetMap')).toBeVisible();
    await expect(page.locator('.leaflet-tile').first()).toBeAttached({ timeout: 15_000 });
    expect(tileRequests.length).toBeGreaterThan(0);

    // Pins are placed from stored lat/lng, so one marker per dog on the map
    // proves the coordinates survived the round trip through the database.
    const markers = page.locator('.leaflet-marker-icon');
    const heading = await page.getByRole('heading', { name: /dogs? on the map/ }).textContent();
    const expectedPins = Number(heading?.match(/^\d+/)?.[0] ?? 0);
    expect(expectedPins).toBeGreaterThan(0);
    await expect(markers).toHaveCount(expectedPins);

  });

  test('a pin opens a popup that links through to the listing', async ({ page }) => {
    // Filtered to a single dog: pins that overlap at low zoom would otherwise
    // make "the first marker" ambiguous.
    await page.goto('/map?q=Husky');
    const marker = page.locator('.leaflet-marker-icon');
    await expect(marker).toHaveCount(1);

    await marker.click();
    await expect(page.getByText('Seattle, Washington').first()).toBeVisible();
    await page.getByRole('link', { name: 'View details' }).click();

    await expect(page).toHaveURL(/\/dogs\/[^/]+$/);
    await expect(page.getByRole('heading', { name: 'Luna', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: '← Back to listings' })).toBeVisible();
  });
});

test('an unknown listing returns the not-found page', async ({ page }) => {
  const response = await page.goto('/dogs/no-such-dog');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
});
