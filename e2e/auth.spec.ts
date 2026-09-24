import { expect, test } from '@playwright/test';

test('signing in swaps the nav and opens the guarded routes', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('moderator@example.com');
  await page.getByLabel('Password').fill('demo');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Moderation' })).toBeVisible();

  await page.getByRole('link', { name: 'Moderation' }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole('button', { name: 'Approve' }).first()).toBeVisible();
});

test('a wrong password shows the translated code, not the api message', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('Email').fill('moderator@example.com');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toHaveText('Wrong email or password.');
});

test('a guarded route bounces an anonymous visitor to login and back', async ({ page }) => {
  await page.goto('/mine');
  await expect(page).toHaveURL(/\/login/);

  await page.getByLabel('Email').fill('moderator@example.com');
  await page.getByLabel('Password').fill('demo');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/mine/);
});
