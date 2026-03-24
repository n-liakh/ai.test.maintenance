import { test, expect } from '@playwright/test';
import { MainPage } from '../pages/main-page';

// TC-NAV-001 — Main page navigation links
// Update NAV_LINKS when the site navigation changes; all tests derive from it.
const NAV_LINKS = [
  { label: 'Docs',      href: '/docs/intro',                pageTitle: /Installation/       },
  { label: 'API',       href: '/docs/api/class-playwright',  pageTitle: /Playwright Library/ },
  { label: 'Community', href: '/community/welcome',          pageTitle: /Welcome/            },
] as const;

const EXPECTED_NAV_LINK_COUNT = NAV_LINKS.length;

test.describe('Main page navigation links', () => {

  let mainPage: MainPage;

  test.beforeEach(async ({ page }) => {
    mainPage = new MainPage(page);
    await mainPage.goto();
  });

  // ── TC-NAV-001-A: Accessibility, visibility, and link-count completeness ──

  test(
    'nav landmark and links are accessible, enabled, and total count matches the expected set',
    {
      annotation: { type: 'TestCase', description: 'TC-NAV-001-A' },
      tag: ['@smoke', '@accessibility'],
    },
    async () => {
      await test.step('Assert nav aria-label, visibility, and enabled state', async () => {
        await mainPage.assertNavAccessibility(NAV_LINKS.map(n => n.label));
      });

      await test.step(`Assert nav has at least ${EXPECTED_NAV_LINK_COUNT} links`, async () => {
        // >= not ===: the live site may include links outside NAV_LINKS scope.
        const actualCount = await mainPage.nav.getByRole('link').count();
        expect.soft(actualCount).toBeGreaterThanOrEqual(EXPECTED_NAV_LINK_COUNT);
      });
    },
  );

  // ── TC-NAV-001-B: href attribute integrity ────────────────────────────────

  test(
    'each nav link href exactly matches the expected destination path',
    {
      annotation: { type: 'TestCase', description: 'TC-NAV-001-B' },
      tag: ['@smoke'],
    },
    async () => {
      for (const { label, href } of NAV_LINKS) {
        const link = mainPage.navLink(label);

        await test.step(`"${label}" href matches "${href}" exactly`, async () => {
          await expect.soft(link).toHaveAttribute('href', new RegExp(`^${href}$`));
        });
      }
    },
  );

  // ── TC-NAV-001-C: Click-through navigation ────────────────────────────────

  for (const { label, href, pageTitle } of NAV_LINKS) {
    test(
      `clicking "${label}" navigates to the correct URL and loads the destination page`,
      {
        annotation: { type: 'TestCase', description: 'TC-NAV-001-C' },
        tag: ['@smoke', '@navigation'],
      },
      async ({ page }) => {
        await test.step(`Click "${label}"`, async () => {
          await mainPage.navLink(label).click();
        });

        await test.step('Verify URL', async () => {
          // Boundary group ($|[?#/]) stops "/docs/intro" matching "/docs/introduction".
          await expect(page).toHaveURL(new RegExp(`${href}($|[?#/])`));
        });

        await test.step('Verify page title — rules out a 404 at a matching URL', async () => {
          await expect(page).toHaveTitle(pageTitle);
        });
      },
    );
  }

  // ── TC-NAV-001-E: Edge case — hidden / disabled link state ────────────────

  test(
    'edge case: no nav link carries aria-hidden or aria-disabled — catches silent accessibility regressions',
    {
      annotation: { type: 'TestCase', description: 'TC-NAV-001-E' },
      tag: ['@accessibility', '@edge'],
    },
    async () => {
      for (const { label } of NAV_LINKS) {
        const link = mainPage.navLink(label);

        await test.step(`"${label}" — no aria-hidden or aria-disabled`, async () => {
          // toBeVisible() misses aria-hidden; toBeEnabled() misses aria-disabled.
          await expect.soft(link).not.toHaveAttribute('aria-hidden', 'true');
          await expect.soft(link).not.toHaveAttribute('aria-disabled', 'true');
        });
      }
    },
  );

  // ── TC-NAV-001-F: Edge case — link hidden via CSS ─────────────────────────

  test(
    'edge case: a nav link hidden via CSS is detected as not visible — guards against broken feature-flag deploys',
    {
      annotation: { type: 'TestCase', description: 'TC-NAV-001-F' },
      tag: ['@edge', '@accessibility'],
    },
    async () => {
      const { label } = NAV_LINKS[0]; // 'Docs' — representative target

      await test.step(`Hide "${label}" via CSS`, async () => {
        await mainPage.hideNavLink(label);
      });

      await test.step(`Assert "${label}" is not visible`, async () => {
        // includeHidden:true lets Playwright locate the element to assert against.
        await expect(mainPage.navLink(label, true)).not.toBeVisible();
      });

      await test.step('Assert remaining links are unaffected', async () => {
        for (const { label: otherLabel } of NAV_LINKS.filter(n => n.label !== label)) {
          await expect.soft(mainPage.navLink(otherLabel)).toBeVisible();
        }
      });
    },
  );

  // ── TC-NAV-001-G: Edge case — wrong target URL via route interception ──────

  test(
    'edge case: a nav link redirected to the wrong URL is detected — simulates a misconfigured CDN rewrite',
    {
      annotation: { type: 'TestCase', description: 'TC-NAV-001-G' },
      tag: ['@edge', '@navigation'],
    },
    async ({ page }) => {
      const { href } = NAV_LINKS[0]; // '/docs/intro'
      // Absolute URL the broken CDN rewrite sends users to instead of the Docs page.
      const wrongDestination = 'https://playwright.dev/';

      await test.step(`Intercept "${href}" and redirect to home`, async () => {
        // page.goto triggers a real document request; a nav-link click uses
        // client-side pushState and never fires page.route on this SPA.
        await page.route(`**${href}`, route =>
          route.fulfill({ status: 302, headers: { Location: wrongDestination }, body: '' }),
        );
      });

      await test.step(`Navigate to "${href}" to trigger the redirect`, async () => {
        await page.goto(href);
      });

      await test.step('Assert the browser landed on the home page', async () => {
        await expect(page).toHaveURL(wrongDestination);
      });
    },
  );

});
