import { expect, test } from '@playwright/test';

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
  await page.getByRole('radio', { name: 'Lost' }).check();
  await expect(page).toHaveURL(/type=LOST/);

  await page.reload();
  await expect(page.getByRole('radio', { name: 'Lost' })).toBeChecked();
});

test('a route change starts at the top of the page', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('heading', { name: 'How it works' }).scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await page.getByRole('link', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/login/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.getByRole('link', { name: 'Map', exact: true }).click();
  await expect(page.locator('.leaflet-container')).toBeVisible();
});

test('an unknown url gets the 404 screen, not a blank page', async ({ page }) => {
  await page.goto('/no-such-page');

  await expect(page.getByRole('heading', { name: 'Nothing here' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'strays' })).toBeVisible();

  await page.getByRole('link', { name: 'Back to the map' }).click();
  await expect(page.locator('.leaflet-container')).toBeVisible();
});

test('language, titles and the html lang follow the switcher', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Animals near you · strays/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.getByRole('radio', { name: 'Português' }).check();
  await expect(page.getByRole('link', { name: 'Publicar anúncio' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt');
  await expect(page).toHaveTitle(/Animais perto de si · strays/);

  await page.reload();
  await expect(page.getByRole('link', { name: 'Publicar anúncio' })).toBeVisible();
});

// pathOptions.className looks like it works in dev, where StrictMode mounts the
// layer twice and leaves the class behind, and ships a leaflet-blue circle to
// production. the styling goes through the container's class instead.
test('the approximate-location circle is brand coloured, not leaflet default', async ({ page }) => {
  await page.goto('/listings/22222222-2222-2222-2222-222222222222');

  const circle = page.locator('.spot-map path').first();
  await expect(circle).toBeAttached();

  const fill = await circle.evaluate((node) => getComputedStyle(node).fill);
  expect(fill).toBe('rgb(180, 71, 42)');
});

test.describe('dark theme', () => {
  test.use({ colorScheme: 'dark' });

  // leaflet's stylesheet is unlayered, so an override placed inside a @layer
  // silently loses to it. this is that regression.
  test('the tokens resolve, leaflet included', async ({ page }) => {
    const read = (selector: string, property: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((node, prop) => getComputedStyle(node).getPropertyValue(prop), property);

    await page.goto('/login');
    expect(await read('body', 'background-color')).toBe('rgb(20, 18, 15)');
    expect(await read('h1', 'color')).toBe('rgb(244, 241, 236)');

    await page.goto('/');
    expect(await read('.leaflet-container', 'background-color')).toBe('rgb(38, 35, 30)');
  });
});
