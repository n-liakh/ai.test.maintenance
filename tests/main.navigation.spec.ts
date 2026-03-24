import { test, expect } from '@playwright/test';
import { MainPage } from '../pages/main-page';

test.describe('Main page navigation', () => {
  test('The main page should display navigation links: Docs, API, Community', async ({
    page,
  }) => {
    const mainPage = new MainPage(page);

    await mainPage.goto();

    await expect.soft(mainPage.nav).toBeVisible();
    await expect.soft(mainPage.docsLink).toBeVisible();
    await expect.soft(mainPage.apiLink).toBeVisible();
    await expect.soft(mainPage.communityLink).toBeVisible();
  });
});
