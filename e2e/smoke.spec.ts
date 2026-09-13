import { expect, test } from '@playwright/test';

// no API behind this build, so only the shell and the map are asserted. the
// map is the part jsdom can't cover: leaflet needs real layout boxes.
test('the shell and the map render', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'strays' })).toBeVisible();
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(page.getByRole('link', { name: 'OpenStreetMap' })).toBeVisible();
});

test('panning the map writes the viewport to the url', async ({ page }) => {
  await page.goto('/');
  const map = page.locator('.leaflet-container');
  await expect(map).toBeVisible();

  const box = await map.boundingBox();
  if (!box) throw new Error('map has no layout box');

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 120, box.y + box.height / 2 - 80, { steps: 10 });
  await page.mouse.up();

  await expect(page).toHaveURL(/lat=.*lng=.*z=/);
});

test('a filter survives a reload because it lives in the url', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Lost' }).click();
  await expect(page).toHaveURL(/type=LOST/);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Lost' })).toHaveAttribute('aria-pressed', 'true');
});
