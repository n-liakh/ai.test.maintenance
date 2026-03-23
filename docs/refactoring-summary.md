# Refactoring Summary — Main Page Navigation Tests

## Version 1 — Degraded (`main.navigation.spec.ts`) 

- `docsLink` uses `page.locator('#docs')` — ID does not exist; `toBeVisible()` always fails
- `docsLink` scoped to `page` instead of `this.nav`
- `page.waitForTimeout(2000)` — fixed sleep anti-pattern
- Mixed selector strategies: CSS ID for Docs, `getByRole` for API and Community
- No `href` attribute assertions — links could point anywhere
- No click-and-navigate checks — navigation targets never verified
- All assertions in one block — first failure hides the rest
- Redundant `nav` visibility assertion
- Test title says "buttons"; elements are `<a role="link">`
- No `toBeEnabled()` check
- `expect` not imported in POM

## Version 2 — AI-refactored (`main.navigation.refactored.spec.ts`) 

- Fixed `docsLink`: `this.nav.getByRole('link', { name: 'Docs' })` — correct scope and strategy
- All three nav locators now use `getByRole` uniformly
- Added `expect` to POM import
- Added page-load guard in `goto()`: `toHaveTitle(/Playwright/)`
- Removed `page.waitForTimeout(2000)`
- Added `toHaveAttribute('href', ...)` assertion per link
- Added one dedicated click-and-navigate test per link
- Switched to `expect.soft()` — all failures surface in one run
- Removed redundant `nav` visibility assertion
- Renamed test title: "buttons" → "links"
- Added `toBeEnabled()` per link
- `NAV_LINKS` constant centralises names and hrefs — one edit location when the site changes
- Every phase wrapped in a named `test.step()` for readable traces

## Version 3 — Manually improved (extended POM) 

- Added `assertNavAccessibility()` to `MainPage`:
  - Asserts `aria-label="Main"` on the nav landmark — proves the accessible name is explicitly in the DOM, not just computed
  - Asserts each link is visible and enabled via `expect.soft()`
- Spec delegates to `assertNavAccessibility()` in a single named step instead of repeating per-link logic inline
- Spec now owns only href and click-navigate concerns; all locator/accessibility logic lives in the POM
