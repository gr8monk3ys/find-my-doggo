import { expect, test } from '@playwright/test';

/** Smallest valid PNG, so the upload path is exercised without a fixture file. */
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

/** Unique per run so repeated runs against the same database stay independent. */
function uniqueName(): string {
  return `Rex${Date.now().toString().slice(-8)}`;
}

test('health endpoint reports a reachable database', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: 'ok', database: 'reachable' });
});

test('a reported dog is persisted, viewable, and searchable', async ({ page }) => {
  const name = uniqueName();

  await page.goto('/report');
  await page.getByRole('button', { name: 'found dog' }).click();
  await page.getByLabel("Dog's name (if known)").fill(name);
  await page.getByLabel('Breed').fill('Border Collie');
  await page.getByLabel('Colour and markings').fill('Black and white');
  await page
    .getByLabel('Description')
    .fill('Very friendly black and white collie, no collar, found near the north gate this morning.');
  await page.getByLabel('Found location').fill('Bristol, United Kingdom');
  await page.getByLabel('Contact email').fill('finder@example.com');
  await page.getByLabel('Photo of the dog (optional)').setInputFiles({
    name: 'collie.png',
    mimeType: 'image/png',
    buffer: TINY_PNG,
  });
  await expect(page.getByRole('img', { name: 'Preview of collie.png' })).toBeVisible();
  await page.getByRole('button', { name: 'Submit report' }).click();

  await expect(page.getByRole('heading', { name: 'Report published' })).toBeVisible();

  // The listing is real: following the link loads it from the database.
  await page.getByRole('link', { name: 'View your listing' }).click();
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
  await expect(page.getByText('Border Collie').first()).toBeVisible();

  // The photo was stored, not just previewed: the API hands back a URL that serves.
  await expect(page.getByAltText(`${name}, a Black and white Border Collie`)).toBeVisible();
  const id = new URL(page.url()).pathname.split('/').pop();
  const { dog } = await (await page.request.get(`/api/dogs/${id}`)).json();
  expect(dog.imageUrl).toBeTruthy();
  expect((await page.request.get(dog.imageUrl)).status()).toBe(200);

  // The reporter's email must never reach the page.
  await expect(page.locator('body')).not.toContainText('finder@example.com');

  // And it is findable through search on the listings page.
  await page.goto('/dogs');
  await page.getByLabel('Search by name, breed, or location').fill(name);
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
});

test('server-side validation is surfaced next to the offending field', async ({ page }) => {
  await page.goto('/report');
  await page.getByLabel('Breed').fill('Beagle');
  await page.getByLabel('Colour and markings').fill('Tricolor');
  await page.getByLabel('Description').fill('Small tricolour beagle wearing a red collar with no tags.');
  await page.getByLabel('Last seen location').fill('Leeds');
  await page.getByLabel('Contact email').fill('definitely-not-an-email');
  await page.getByRole('button', { name: 'Submit report' }).click();

  await expect(page.getByText('Please correct the highlighted fields.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Report published' })).toHaveCount(0);
});
