import { expect, test } from '@playwright/test';

test('each page sets its own title and the document language follows the switcher', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Animals near you · strays/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.goto('/login');
  await expect(page).toHaveTitle(/Sign in · strays/);

  await page.goto('/nope');
  await expect(page).toHaveTitle(/Nothing here · strays/);

  // a screen reader picks its pronunciation from this attribute, so it has to
  // track the chosen language rather than whatever index.html hard-coded
  await page.goto('/');
  await page.getByRole('button', { name: 'Português' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
  await expect(page).toHaveTitle(/Animais perto de si · strays/);
});
