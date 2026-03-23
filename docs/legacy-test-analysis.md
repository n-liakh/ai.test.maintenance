# Legacy Test Analysis — `tests/main.navigation.spec.ts`

Review of the current spec and its POM (`pages/main-page.ts`) against the manual test case:
> _"The main page should display navigation buttons: Docs, API, Community — visible, accessible by role+name, and navigate correctly."_

---

## 🔴 Critical — Will cause test failures

- [ ] **C1 — Broken selector (`docsLink`)** _(Selector quality)_  
  `this.page.locator('#docs')` targets an element with `id="docs"` that does not exist on the live page. The locator is empty and `toBeVisible()` will fail.  
  _File:_ `pages/main-page.ts`

- [ ] **C2 — Wrong scope for `docsLink`** _(Selector quality / Duplication risk)_  
  `docsLink` is scoped to `this.page` instead of `this.nav`, unlike `apiLink` and `communityLink`. Could match an unintended element if a `#docs` ID appeared elsewhere.  
  _File:_ `pages/main-page.ts`

---

## 🟠 High — Flakiness / maintenance cost

- [ ] **H1 — Hard-coded `waitForTimeout(2000)`** _(Synchronization)_  
  Playwright auto-waits on every locator assertion. A fixed 2 s sleep adds latency to every run and is an explicit anti-pattern. Remove it.  
  _File:_ `tests/main.navigation.spec.ts`

- [ ] **H2 — Inconsistent selector strategy** _(Readability / Maintenance cost)_  
  `docsLink` uses a CSS ID selector while the other two use `getByRole`. No consistent pattern for future contributors.  
  _File:_ `pages/main-page.ts`

---

## 🟡 Medium — Coverage gaps

- [ ] **M1 — No `href` attribute assertions** _(Coverage — navigation targets)_  
  A link could be visible but point to `#` or a wrong URL. Add `toHaveAttribute('href', ...)` checks for each nav link.  
  _File:_ `tests/main.navigation.spec.ts`

- [ ] **M2 — No click-and-navigate checks** _(Coverage — navigation targets)_  
  The manual test case requires links to _navigate correctly_. Nothing tests that clicking a link actually lands on the expected page.  
  _File:_ `tests/main.navigation.spec.ts`

- [ ] **M3 — All assertions inside one test block** _(Failure isolation)_  
  If `docsLink` fails, failures for `apiLink` and `communityLink` are never reported. Use `expect.soft()` or split into focused tests.  
  _File:_ `tests/main.navigation.spec.ts`

---

## 🔵 Low — Accessibility & readability debt

- [ ] **L1 — Redundant `nav` visibility assertion** _(Redundancy)_  
  `expect(mainPage.nav).toBeVisible()` is redundant — all child locators are already scoped to `nav`. Provides no extra diagnostic value.  
  _File:_ `tests/main.navigation.spec.ts`

- [ ] **L2 — Test title says "buttons" instead of "links"** _(Readability)_  
  Elements are `<a>` links (`role="link"`), not buttons. Misleading in test reports.  
  _File:_ `tests/main.navigation.spec.ts`

- [ ] **L3 — No keyboard-accessibility check** _(Accessibility)_  
  The manual case implies accessibility. No assertion confirms links are enabled and keyboard-reachable (e.g. `toBeEnabled()`).  
  _File:_ `tests/main.navigation.spec.ts`

- [ ] **L4 — `expect` not imported in POM** _(Maintenance cost)_  
  Any future guard assertion added to `MainPage` (e.g. confirming a navigation landed) will fail to compile.  
  _File:_ `pages/main-page.ts`

---

## Recommended Fix Categories (for next refactor)

| Priority | Fix |
|----------|-----|
| C1 + C2 | Replace `this.page.locator('#docs')` with `this.nav.getByRole('link', { name: 'Docs' })` |
| H1 | Remove `page.waitForTimeout(2000)` |
| H2 | Standardise all three nav locators to `getByRole` scoped to `this.nav` |
| M1 | Add `toHaveAttribute('href', ...)` assertions per link |
| M2 | Add click-and-navigate tests (or extend coverage to verify URL after click) |
| M3 | Use `expect.soft()` or split into per-link tests |
| L1 | Remove or replace the redundant nav container assertion |
| L2 | Rename test title: "buttons" → "links" |
| L3 | Add `toBeEnabled()` to each link assertion |
| L4 | Add `expect` to the POM import |

---

## Additional findings

No page load guard after `goto()`
`MainPage.goto()` awaits the navigation but does not verify the correct page actually loaded. A redirect, a maintenance page, or a CDN error page would leave the DOM in an unexpected state yet the test would continue and produce confusing failures. A simple `expect(page).toHaveTitle(...)` or `expect(page).toHaveURL('/')` after `goto()` would catch this class of environment failure immediately.

Hardcoded link names and hrefs are scattered, not centralised
Link names (`'Docs'`, `'API'`, `'Community'`) and any future href values will be repeated across the POM and the spec. When the site renames a nav item (it has happened before — "Community" was previously "Resources" on some doc sites), engineers must hunt for every occurrence. A shared constants file or a typed `NavItem` fixture would make such changes a one-line update.

`toBeVisible()` does not prove visual accessibility
An element can pass `toBeVisible()` and still be effectively invisible to a user: `opacity: 0`, `color` matching the background, or `pointer-events: none` would all pass the assertion. Need to check `toBeEnabled()` and consider a contrast/visual regression baseline (even a simple screenshot comparison) for a navigation smoke test, since a broken CSS deploy could hide the nav without affecting the DOM.

No assertion on the active/current-page state
The manual test case implies the nav is functional. On the live page, the currently active section gets an `aria-current="page"` or an active CSS class on the matching link. There is no test that the home page does *not* incorrectly mark `Docs`, `API`, or `Community` as active — a regression that real users would notice (wrong item highlighted) but the current assertions would never catch.
