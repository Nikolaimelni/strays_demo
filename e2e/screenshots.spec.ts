import { expect, test } from '@playwright/test';

const PAGES = [
  { name: 'home', path: '/' },
  { name: 'listing', path: '/listings/22222222-2222-2222-2222-222222222222' },
  { name: 'login', path: '/login' },
  { name: 'register', path: '/register' },
  { name: 'not-found', path: '/nope' },
];

const AUTHED = [
  { name: 'profile', path: '/profile' },
  { name: 'new', path: '/new' },
  { name: 'mine', path: '/mine' },
  { name: 'admin', path: '/admin' },
];

// a fixed pause races the images: a full-page shot taken before a hero photo
// decodes shows an empty column, which is what these shots exist to catch.
const settle = async (page: import('@playwright/test').Page) => {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page
    .waitForFunction(
      () => [...document.images].every((image) => image.complete && image.naturalWidth > 0),
      undefined,
      { timeout: 8000 },
    )
    .catch(() => {});
};

const signIn = async (page: import('@playwright/test').Page) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('moderator@example.com');
  await page.getByLabel('Password').fill('demo');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
};

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} theme @shots`, () => {
    // a full-page shot captures past the viewport without scrolling, so
    // anything waiting for a scroll to reveal itself is blank in it
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' });

    test(`public pages, ${scheme}`, async ({ page }) => {
      for (const target of PAGES) {
        await page.goto(target.path);
        await settle(page);
        await page.screenshot({ path: `shots/${scheme}-${target.name}.png`, fullPage: true });
      }
    });

    test(`signed-in pages, ${scheme}`, async ({ page }) => {
      await signIn(page);
      for (const target of AUTHED) {
        await page.goto(target.path);
        await settle(page);
        await page.screenshot({ path: `shots/${scheme}-${target.name}.png`, fullPage: true });
      }
    });
  });
}

test.describe('mobile @shots', () => {
  test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });

  test('narrow layout', async ({ page }) => {
    for (const target of [PAGES[0], PAGES[1]] as { name: string; path: string }[]) {
      await page.goto(target.path);
      await settle(page);
      await page.screenshot({ path: `shots/mobile-${target.name}.png`, fullPage: true });
    }
  });
});
