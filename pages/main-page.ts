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
 
  async assertNavAccessibility() {  
    await expect.soft(this.nav).toBeVisible();
    await expect.soft(this.nav).toHaveAttribute('aria-label', 'Main');

    for (const link of [this.docsLink, this.apiLink, this.communityLink]) {
      await expect.soft(link).toBeVisible();
      await expect.soft(link).toBeEnabled();
    }
  }
}
