import { expect, test } from '@playwright/test';

const signIn = async (page: import('@playwright/test').Page, email = 'moderator@example.com') => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('demo');
  await page.getByRole('button', { name: 'Sign in' }).click();
};

test('two-step sign in asks for the code and then lets you in', async ({ page }) => {
  await signIn(page, 'two-step@example.com');

  await page.getByLabel(/recovery code/).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
});

test('a shelter import runs in the background and its result shows up', async ({ page }) => {
  await signIn(page);
  await page.goto('/admin/shelters');

  const tejo = page.getByRole('listitem').filter({ hasText: 'Abrigo do Tejo' });
  await tejo.getByRole('button', { name: 'Import now' }).click();

  await expect(tejo.getByText('Importing')).toBeVisible();
  await expect(tejo.getByText(/Last run .* 1 updated/)).toBeVisible({ timeout: 10_000 });
});

test('a shelter without consent cannot be imported', async ({ page }) => {
  await signIn(page);
  await page.goto('/admin/shelters');

  const patas = page.getByRole('listitem').filter({ hasText: 'Patas de Almada' });
  await expect(patas.getByRole('button', { name: 'Import now' })).toBeDisabled();
});

test('anybody can send a notice about a listing, without an account', async ({ page }) => {
  await page.goto('/listings/22222222-2222-2222-2222-222222222222');
  await page.getByRole('link', { name: 'Report illegal content' }).click();

  await expect(page.getByLabel(/Link to the listing/)).toHaveValue(
    '22222222-2222-2222-2222-222222222222',
  );
  await page.getByLabel(/Why you believe/).fill('This listing is selling a puppy for money.');
  await page.getByLabel('Your name').fill('Rita');
  await page.getByLabel('Your email address').fill('rita@example.com');
  await page.getByLabel(/good faith/).check();
  await page.getByRole('button', { name: 'Send the notice' }).click();

  await expect(page.getByRole('status')).toContainText('Received');
});

test.describe('a visitor who has not turned the map on', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('gets a panel instead of tiles, and the tiles after asking', async ({ page }) => {
    const tiles: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('tile.openstreetmap.org')) tiles.push(request.url());
    });

    await page.goto('/');
    await expect(page.getByText('The map is off until you turn it on')).toBeVisible();
    expect(tiles).toEqual([]);

    await page.getByRole('button', { name: 'Show the map' }).click();
    await expect(page.locator('.leaflet-tile').first()).toBeAttached();
  });
});

test('a signed-in visitor writes to the poster, and a shelter animal has no form', async ({
  page,
}) => {
  await signIn(page);
  await page.goto('/listings/22222222-2222-2222-2222-222222222222');

  await page.getByLabel(/Your message/).fill('I think I saw this dog by the tram stop yesterday.');
  await expect(page.getByLabel('Where to answer you')).toHaveValue('moderator@example.com');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.getByRole('status')).toContainText('Sent');

  await page.goto('/listings/88888888-8888-8888-8888-888888888888');
  await expect(page.getByRole('link', { name: "This animal on the shelter's site" })).toBeVisible();
  await expect(page.getByLabel(/Your message/)).toHaveCount(0);
});
