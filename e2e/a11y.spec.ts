import AxeBuilder from '@axe-core/playwright';
import { expect, type Page, test } from '@playwright/test';

// contrast is not something you can judge from a screenshot, and this palette
// is hand-picked rather than borrowed from one that did the maths already
const scan = async (page: Page) =>
  new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('.leaflet-container')
    .analyze();

const signIn = async (page: Page) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('moderator@example.com');
  await page.getByLabel('Password').fill('demo');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
};

const PUBLIC_PAGES = [
  '/',
  '/listings/22222222-2222-2222-2222-222222222222',
  '/login',
  '/register',
  '/verify-email?token=whatever',
  '/forgot-password',
  '/reset-password?token=whatever',
  '/privacy',
  '/terms',
  '/nope',
];
const PRIVATE_PAGES = ['/new', '/mine', '/admin', '/admin/reports', '/admin/audit', '/profile'];

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`accessibility, ${scheme}`, () => {
    test.use({ colorScheme: scheme, reducedMotion: 'reduce' });

    test(`public pages have no violations, ${scheme}`, async ({ page }) => {
      for (const path of PUBLIC_PAGES) {
        await page.goto(path);
        await page.waitForTimeout(300);
        const { violations } = await scan(page);
        expect(
          violations.flatMap((violation) =>
            violation.nodes.map(
              (node) =>
                `${path} ${violation.id} ${node.target.join(' ')} :: ${node.failureSummary}`,
            ),
          ),
        ).toEqual([]);
      }
    });

    test(`signed-in pages have no violations, ${scheme}`, async ({ page }) => {
      await signIn(page);
      for (const path of PRIVATE_PAGES) {
        await page.goto(path);
        await page.waitForTimeout(300);
        const { violations } = await scan(page);
        expect(
          violations.flatMap((violation) =>
            violation.nodes.map(
              (node) =>
                `${path} ${violation.id} ${node.target.join(' ')} :: ${node.failureSummary}`,
            ),
          ),
        ).toEqual([]);
      }
    });
  });
}
