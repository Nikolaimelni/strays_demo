import { expect, test } from '@playwright/test';

test('an unknown url gets the 404 screen, not a blank page', async ({ page }) => {
  await page.goto('/no-such-page');

  await expect(page.getByRole('heading', { name: 'Nothing here' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'strays' })).toBeVisible();

  await page.getByRole('link', { name: 'Back to the map' }).click();
  await expect(page.locator('.leaflet-container')).toBeVisible();
});

test('switching language translates the shell and survives a reload', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Post a listing' })).toBeVisible();

  await page.getByRole('button', { name: 'Português' }).click();
  await expect(page.getByRole('link', { name: 'Publicar anúncio' })).toBeVisible();

  // the detector persists the choice, so a reload must not snap back to English
  await page.reload();
  await expect(page.getByRole('link', { name: 'Publicar anúncio' })).toBeVisible();
});
