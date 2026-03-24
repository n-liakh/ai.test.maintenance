import { test, expect } from '@playwright/test';
import { MainPage } from '../pages/main-page';

/**
 * Canonical nav links: accessible name and expected href target.
 * Update here if the site navigation changes — one place, no hunting.
 */
const NAV_LINKS = [
  { label: 'Docs',      href: '/docs/intro' },
  { label: 'API',       href: '/docs/api/class-playwright' },
  { label: 'Community', href: '/community/welcome' },
] as const;

test.describe('Main page navigation links', () => {

  // ── Presence, visibility, and href attributes ──────────────────────────────

  test('nav links are visible, enabled, and carry the correct href', async ({ page }) => {
    const mainPage = new MainPage(page);

    await test.step('Navigate to home page and verify it loaded', async () => {
      await mainPage.goto();
    });

    await test.step('Assert nav landmark and link accessibility', async () => {
      await mainPage.assertNavAccessibility(NAV_LINKS.map(n => n.label));
    });

    for (const { label, href } of NAV_LINKS) {
      const link = mainPage.nav.getByRole('link', { name: label });

      await test.step(`"${label}" link – href points to "${href}"`, async () => {
        await expect.soft(link).toHaveAttribute('href', href);
      });
    }
  });

  // ── Click-through navigation ───────────────────────────────────────────────

  for (const { label, href } of NAV_LINKS) {
    test(`clicking "${label}" navigates to the expected URL`, async ({ page }) => {
      const mainPage = new MainPage(page);

      await test.step('Navigate to home page and verify it loaded', async () => {
        await mainPage.goto();
      });

      await test.step(`Click the "${label}" nav link`, async () => {
        await mainPage.nav.getByRole('link', { name: label }).click();
      });

      await test.step('Verify the browser lands on the correct URL', async () => {
        await expect(page).toHaveURL(new RegExp(href));
      });
    });
  }

});
