import { expect, test } from '@playwright/test';

// a check, not a screenshot: token plumbing either resolves in both themes or
// it doesn't, and eyeballing a png is a poor way to find out
test.describe('dark theme tokens', () => {
  test.use({ colorScheme: 'dark' });

  test('surfaces resolve to the dark values', async ({ page }) => {
    await page.goto('/login');

    const read = (selector: string, property: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((node, prop) => getComputedStyle(node).getPropertyValue(prop), property);

    const body = await read('body', 'background-color');
    const ink = await read('h1', 'color');
    expect(body).toBe('rgb(20, 18, 15)');
    // forms sit on the page now rather than on a card, so the second probe is
    // the text colour: it proves the whole palette flipped, not just one box
    expect(ink).toBe('rgb(244, 241, 236)');

    // leaflet's own stylesheet is unlayered, so an override placed inside
    // @layer components silently loses to it. this is that regression.
    await page.goto('/');
    const map = await read('.leaflet-container', 'background-color');
    expect(map).toBe('rgb(38, 35, 30)');
  });
});
