import { expect, test } from '@playwright/test';

test('a listing enquiry is accepted and never exposes the reporter email', async ({ page }) => {
  await page.goto('/dogs?q=Husky');
  await page.getByRole('link', { name: /View details/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Luna', level: 1 })).toBeVisible();

  // The subject is prefilled from the listing so the reporter has context.
  await expect(page.getByLabel('Subject')).toHaveValue(/About Luna/);

  await page.getByLabel('Your name').fill('Sam Rivera');
  await page.getByLabel('Your email').fill('sam@example.com');
  await page.getByLabel('Message').fill('I think I saw this husky near the park entrance around 8am today.');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByRole('heading', { name: 'Message sent' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText('@example.com', { useInnerText: true });
});

test('the general contact form rejects a message that is too short', async ({ page }) => {
  await page.goto('/contact');
  await page.getByLabel('Your name').fill('Sam');
  await page.getByLabel('Your email').fill('sam@example.com');
  await page.getByLabel('Subject').fill('Question');
  await page.getByLabel('Message').fill('hi');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByText('Please correct the highlighted fields.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Message sent' })).toHaveCount(0);
});

test('an enquiry for a listing that no longer exists is rejected', async ({ request }) => {
  const response = await request.post('/api/messages', {
    data: {
      dogId: 'no-such-dog',
      name: 'Sam',
      email: 'sam@example.com',
      subject: 'Question about a dog',
      message: 'Is this listing still current? I may have seen this dog nearby.',
    },
  });
  expect(response.status()).toBe(404);
});
