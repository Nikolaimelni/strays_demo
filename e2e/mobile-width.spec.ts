import { expect, test } from '@playwright/test';

// 360px is the narrowest phone worth supporting, and a page that scrolls
// sideways there is broken in a way that is invisible on a laptop. this was a
// real bug: a grid item is min-width:auto, so it refused to shrink below the
// photo strip inside it and pushed the whole document wide.
const PUBLIC = ['/', '/login', '/register', '/nope'];
const PRIVATE = ['/new', '/mine', '/admin', '/profile'];

const signIn = async (page: import('@playwright/test').Page) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('moderator@example.com');
  await page.getByLabel('Password').fill('demo');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
};

const widthOf = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth,
  }));

test.describe('narrow screens', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('no page scrolls sideways at 360px', async ({ page }) => {
    const offenders: string[] = [];

    for (const path of PUBLIC) {
      await page.goto(path);
      await page.waitForLoadState('networkidle').catch(() => {});
      const { client, scroll } = await widthOf(page);
      if (scroll > client) offenders.push(`${path} scrolls to ${scroll} in ${client}`);
    }

    await signIn(page);

    for (const path of PRIVATE) {
      await page.goto(path);
      await page.waitForLoadState('networkidle').catch(() => {});
      const { client, scroll } = await widthOf(page);
      if (scroll > client) offenders.push(`${path} scrolls to ${scroll} in ${client}`);
    }

    expect(offenders).toEqual([]);
  });

  test('the header stays one row and the menu opens', async ({ page }) => {
    await page.goto('/');
    const header = page.getByRole('banner');
    expect((await header.boundingBox())?.height ?? 0).toBeLessThan(90);

    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await expect(page.locator('#mobile-nav').getByRole('link', { name: 'Map' })).toBeVisible();
  });
});
