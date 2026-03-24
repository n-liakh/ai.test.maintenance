import { expect, type Locator, type Page } from '@playwright/test';

export class MainPage {
  readonly page: Page;
  readonly nav: Locator;
  readonly docsLink: Locator;
  readonly apiLink: Locator;
  readonly communityLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nav = page.getByRole('navigation', { name: 'Main' });
    this.docsLink = this.nav.getByRole('link', { name: 'Docs' });
    this.apiLink = this.nav.getByRole('link', { name: 'API' });
    this.communityLink = this.nav.getByRole('link', { name: 'Community' });
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.page).toHaveTitle(/Playwright/);
  }

  /**
   * Returns the locator for a nav link by its accessible label.
   * Pass `includeHidden = true` when asserting on a link that may have been
   * programmatically hidden (e.g., in CSS-regression edge-case tests), so
   * Playwright does not filter the element out before the assertion runs.
   */
  navLink(label: string, includeHidden = false): Locator {
    return this.nav.getByRole('link', { name: label, includeHidden });
  }

  /**
   * Asserts the nav landmark has the correct aria-label, and that every link
   * in `expectedLabels` is visible and enabled.
   *
   * Accepts the label list as a parameter so it stays in sync with the
   * spec's `NAV_LINKS` constant — no second hardcoded list to maintain.
   */
  async assertNavAccessibility(expectedLabels: readonly string[]): Promise<void> {
    await expect.soft(this.nav).toBeVisible();
    await expect.soft(this.nav).toHaveAttribute('aria-label', 'Main');

    for (const label of expectedLabels) {
      const link = this.navLink(label);
      await expect.soft(link).toBeVisible();
      await expect.soft(link).toBeEnabled();
    }
  }

  /**
   * Hides a nav link by injecting `display:none` directly on the DOM element.
   * Use in edge-case tests only — simulates a CSS regression or a broken
   * feature-flag deploy that removes a link from view without touching the DOM.
   */
  async hideNavLink(label: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.navLink(label).evaluate((el: any) => { el.style.display = 'none'; });
  }
}
