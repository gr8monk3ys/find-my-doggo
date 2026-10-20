import { expect, test } from '@playwright/test';

/** Matches the throwaway value the Playwright web server is started with. */
const REVIEW_TOKEN = 'e2e-review-token';

test('feedback sent from the footer is saved and readable by a reviewer', async ({ page, request }) => {
  const stamp = Date.now();
  const message = `E2E feedback ${stamp}: the dialog opened from the footer and this note was saved.`;

  await page.goto('/contact');
  await page.getByRole('contentinfo').getByRole('button', { name: 'tell us' }).click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'What broke, or what would help?' })).toBeVisible();

  await dialog.getByLabel('Your feedback').fill(message);
  await dialog.getByRole('button', { name: 'Send feedback' }).click();

  // No mailer in the e2e environment, so the honest outcome is "saved", not "emailed".
  await expect(dialog.getByRole('heading', { name: 'Thanks — saved' })).toBeVisible();
  await expect(dialog).toContainText('Email delivery is not set up on this deployment yet');

  // Escape closes the native dialog and focus goes back to the trigger.
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('contentinfo').getByRole('button', { name: 'tell us' })).toBeFocused();

  // The row exists, and the review route hands it back with the page it came from.
  const response = await request.get('/api/feedback', { headers: { Authorization: `Bearer ${REVIEW_TOKEN}` } });
  expect(response.status()).toBe(200);
  const { feedback } = await response.json();
  expect(feedback).toContainEqual(expect.objectContaining({ page: '/contact', message, status: 'new', email: null }));
});

test('the header carries one feedback link that opens the same dialog', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('banner').getByRole('button', { name: 'Feedback' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').getByText('Private beta')).toBeVisible();
});

test('the review route refuses a wrong or missing token', async ({ request }) => {
  expect((await request.get('/api/feedback')).status()).toBe(401);
  expect((await request.get('/api/feedback', { headers: { Authorization: 'Bearer wrong' } })).status()).toBe(401);
});

test('the general contact form tells the truth when nobody was emailed', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('Your name').fill('Sam Rivera');
  await page.getByLabel('Your email').fill('sam@example.com');
  await page.getByLabel('Subject').fill('A question about takedowns');
  await page.getByLabel('Message').fill('How do I take down a listing I posted last week? The dog is home.');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByRole('heading', { name: 'Message saved' })).toBeVisible();
  await expect(page.getByText("Email delivery isn't set up on this deployment yet")).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Message sent' })).toHaveCount(0);
});

test('the health endpoint reports every feature flag and the database latency', async ({ request }) => {
  const body = await (await request.get('/api/health')).json();
  expect(body).toMatchObject({
    status: 'ok',
    database: 'reachable',
    features: {
      hostedDatabase: false,
      durableImageStorage: false,
      emailDelivery: false,
      geocoding: false,
      feedbackReview: true,
    },
  });
  expect(typeof body.databaseLatencyMs).toBe('number');
  expect(body.mail).toMatchObject({
    contact: { sentLastHour: 0, capPerHour: 20, capped: false },
    feedback: { sentLastHour: 0, capPerHour: 20, capped: false },
  });
  expect(body.version).toMatch(/^\d+\.\d+\.\d+/);
});
