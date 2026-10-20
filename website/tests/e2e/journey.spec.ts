import { expect, test } from '@playwright/test';

/**
 * The product's core loop, walked once in order on a production build:
 * someone reports a dog, someone else finds it in the listings, looks for it
 * on the map, and messages the reporter. The other specs cover each step in
 * isolation; this one proves the hand-offs between them (the id the report
 * returns is the id the listing, the map and the message form use).
 *
 * Geocoding is off in the e2e environment, so the map step asserts the honest
 * outcome: the dog is listed under "Not on the map", not promised a pin.
 */

/** Unique per run so repeated runs against the same database stay independent. */
const name = `Journey${Date.now().toString().slice(-8)}`;
const address = 'Kelvingrove Park, Glasgow';
const reporterEmail = 'journey-owner@example.com';

test('report, browse, map, message: the core loop holds together end to end', async ({ page }) => {
  // 1. Report a lost dog. No photo: the upload path has its own spec.
  await page.goto('/report');
  await page.getByLabel("Dog's name (if known)").fill(name);
  await page.getByLabel('Breed').fill('Whippet');
  await page.getByLabel('Colour and markings').fill('Fawn with a white chest');
  await page
    .getByLabel('Description')
    .fill('Slim fawn whippet, very shy, slipped her collar near the fountain at dusk and ran towards the river.');
  await page.getByLabel('Last seen location').fill(address);
  await page.getByLabel('Contact email').fill(reporterEmail);
  await page.getByRole('button', { name: 'Submit report' }).click();

  await expect(page.getByRole('heading', { name: 'Report published' })).toBeVisible();
  // Geocoding is disabled, so the copy must say the listing is NOT on the map.
  await expect(page.getByText(`We could not place “${address}” on the map`)).toBeVisible();
  await expect(page.getByText('Your listing is live and it is on the map.')).toHaveCount(0);

  const listingLink = page.getByRole('link', { name: 'View your listing' });
  const listingPath = new URL((await listingLink.getAttribute('href')) ?? '', page.url()).pathname;
  expect(listingPath).toMatch(/^\/dogs\/[^/]+$/);

  // 2. Browse: the listing is findable by name and opens at the same id.
  await page.goto('/dogs');
  await page.getByLabel('Search by name, breed, or location').fill(name);
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page).toHaveURL(new RegExp(`q=${name}`));
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await page.getByRole('link', { name: /View details/ }).first().click();
  await expect(page).toHaveURL(new RegExp(`${listingPath}$`));
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
  await expect(page.getByText(address).first()).toBeVisible();

  // 3. Map: filtered to this dog there is nothing to plot, and the page says
  //    so instead of showing an empty map with no explanation.
  await page.goto(`/map?q=${encodeURIComponent(name)}`);
  await expect(page.getByRole('heading', { name: 'Map', level: 1 })).toBeVisible();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(page.getByText('0 pins', { exact: false })).toBeVisible();
  await expect(page.getByText('Nothing to plot for these filters yet.')).toBeVisible();
  await expect(page.locator('.leaflet-marker-icon')).toHaveCount(0);

  await expect(page.getByText('Not on the map')).toBeVisible();
  const unpinnedLink = page.getByRole('link', { name, exact: true });
  await expect(unpinnedLink).toHaveAttribute('href', listingPath);
  await unpinnedLink.click();
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();

  // 4. Message the reporter from the listing. No mailer here, so the honest
  //    outcome is "saved", and the reporter's address never reaches the page.
  await expect(page.getByLabel('Subject')).toHaveValue(new RegExp(`About ${name}`));
  await page.getByLabel('Your name').fill('Sam Rivera');
  await page.getByLabel('Your email').fill('sam@example.com');
  await page
    .getByLabel('Message')
    .fill('I think I saw a fawn whippet matching this description by the river path this evening.');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByRole('heading', { name: 'Message saved' })).toBeVisible();
  await expect(page.getByText('the reporter has not been notified yet')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Message sent' })).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(reporterEmail, { useInnerText: true });

  // The API view of the same listing is equally silent about the reporter.
  const { dog } = await (await page.request.get(`/api${listingPath}`)).json();
  expect(dog.name).toBe(name);
  expect(dog.location).toMatchObject({ address, lat: null, lng: null });
  expect(JSON.stringify(dog)).not.toContain(reporterEmail);
});
