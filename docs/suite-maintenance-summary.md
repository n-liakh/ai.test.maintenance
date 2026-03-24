# Test Suite Maintenance Summary

**Date:** 2026-03-24  
**Scope:** `tests/` × `pages/` — all four spec files and both page-object files  
**Outcome:** 2 critical bugs found in the shared POM; 3 spec files cover the same feature; 1 spec has 3 exact duplicate blocks; fragile selectors in second POM.

---

## 1. File Inventory

| File | Status | Tests |
|---|---|---|
| `tests/main.navigation.spec.ts` | ❌ **Remove** — broken & fully duplicated | 3 × identical blocks |
| `tests/main.navigation.refactored.spec.ts` | ⚠️ **Remove** — superseded by professional spec | 4 |
| `tests/main.navigation.professional.spec.ts` | ✅ **Keep** — canonical | 7 |
| `tests/playwright-dev.spec.ts` | ⚠️ **Keep with fixes** — fragile selectors | 2 |

---

## 2. Broken Selectors

### `pages/main-page.ts`

| Line | Code | Problem |
|---|---|---|
| 13 | `getByRole('link', { name: 'Docsss' })` | Typo — three `s` characters; no matching element exists; `toBeVisible()` always fails |
| 20 | `toHaveTitle(/PlaywrightIncorrectTitle/)` | Wrong regex inside `goto()` — causes every spec that calls `MainPage.goto()` to throw before any assertions run |

Both bugs are in the **shared POM** used by all three `main.navigation.*` specs, making the entire navigation suite non-functional until fixed.

### `pages/playwright-dev-page.ts`

| Line | Code | Problem |
|---|---|---|
| 10 | `page.locator('a', { hasText: 'Get started' })` | Text-based anchor locator; `.first()` call downstream is a smell — any DOM reorder breaks the test |
| 13–14 | `page.locator('li', { hasText: 'Guides' }).locator('a', { hasText: 'Page Object Model' })` | Depends on `<li>` + `<a>` nesting; a sidebar restructure silently breaks the locator |
| 15 | `page.locator('article div.markdown ul > li > a')` | Deep CSS path is fragile; the TOC content has already drifted once (see `refactoring-summary.md`) |

---

## 3. Redundant Scenarios

### Triple duplication inside `main.navigation.spec.ts`

The file contains **one `test.describe` block copy-pasted three times** with identical title, test name, and assertions. All three produce the same report entry; two must be deleted.

```
test.describe('Main page navigation', () => {       ← block 1
  test('…Docs, API, Community', …) { … }
});

test.describe('Main page navigation', () => {       ← block 2  EXACT COPY
  test('…Docs, API, Community', …) { … }
});

test.describe('Main page navigation', () => {       ← block 3  EXACT COPY
  test('…Docs, API, Community', …) { … }
});
```

### Overlapping specs for the same feature

All three `main.navigation.*` files exercise the same user-visible behaviour — "nav links are visible, accessible, and navigate correctly." Coverage is identical at the core; the files differ only in maturity:

| File | href check | click-through | accessibility | edge cases | traceability |
|---|:---:|:---:|:---:|:---:|:---:|
| `main.navigation.spec.ts` | ✗ | ✗ | ✗ | ✗ | ✗ |
| `main.navigation.refactored.spec.ts` | ✓ | ✓ | partial | ✗ | ✗ |
| `main.navigation.professional.spec.ts` | ✓ | ✓ | ✓ | ✓ | ✓ |

### Other redundancy notes

- `main.navigation.spec.ts` uses `mainPage.docsLink / apiLink / communityLink` — fixed-property accessors that are superseded by the `navLink(label)` factory introduced in the POM for the later specs.  
- TC-NAV-001-D is absent in the professional spec (sequence jumps C → E). Minor, but worth renaming for audit consistency.

---

## 4. Consolidation Plan

Execute in order; each step is independently deployable.

### Step 1 — Fix the POM (unblocks everything)

Fix the two bugs in `pages/main-page.ts` (see Section 5 diff).  
After this, `main.navigation.refactored.spec.ts` and `main.navigation.professional.spec.ts` will both pass.

### Step 2 — Delete `tests/main.navigation.spec.ts`

The file is fully broken (relies on the fixed-property accessors referencing the broken selectors) and is entirely superseded by the professional spec. No coverage is lost.

### Step 3 — Delete `tests/main.navigation.refactored.spec.ts`

An intermediate iteration retained for history; every scenario it covers is present in `main.navigation.professional.spec.ts` with stronger assertions.  
After deletion, rename `main.navigation.professional.spec.ts` → `main.navigation.spec.ts` to restore the canonical file name, or keep the `professional` suffix as an explicit quality signal.

### Step 4 — Harden `pages/playwright-dev-page.ts`

Replace three fragile selectors with role- or label-based alternatives:

```typescript
// Before — text locator, relies on DOM order
this.getStartedLink = page.locator('a', { hasText: 'Get started' });

// After — role-based, resilient to copy changes
this.getStartedLink = page.getByRole('link', { name: 'Get started' });
```

```typescript
// Before — deep CSS path, breaks on markup changes
this.tocList = page.locator('article div.markdown ul > li > a');

// After — scope by landmark, more resilient
this.tocList = page.getByRole('article').getByRole('listitem').getByRole('link');
```

```typescript
// Before — nested text search, structure-dependent
this.pomLink = page
  .locator('li', { hasText: 'Guides' })
  .locator('a', { hasText: 'Page Object Model' });

// After — role-based, direct
this.pomLink = page.getByRole('link', { name: 'Page Object Model' });
```

### Step 5 — (Optional) Fill TC-NAV-001-D

Renumber or add a dedicated test for the missing slot. A keyboard-navigation test (Tab + Enter) is a natural fit — it was flagged as future work in `professional-review.md`.

---

## 5. Representative Diff — `pages/main-page.ts`

This is the highest-priority change: two lines in the shared POM that currently prevent **all** navigation tests from executing.

```diff
--- a/pages/main-page.ts
+++ b/pages/main-page.ts
@@ -10,7 +10,7 @@ export class MainPage {
   constructor(page: Page) {
     this.page = page;
     this.nav = page.getByRole('navigation', { name: 'Main' });
-    this.docsLink = this.nav.getByRole('link', { name: 'Docsss' });
+    this.docsLink = this.nav.getByRole('link', { name: 'Docs' });
     this.apiLink = this.nav.getByRole('link', { name: 'API' });
     this.communityLink = this.nav.getByRole('link', { name: 'Community' });
   }
@@ -18,7 +18,7 @@ export class MainPage {

   async goto() {
     await this.page.goto('/');
-    await expect(this.page).toHaveTitle(/PlaywrightIncorrectTitle/);
+    await expect(this.page).toHaveTitle(/Playwright/);
   }
```

**Why this file?**  
`main-page.ts` is the single point of failure: both bugs cascade to all three navigation specs simultaneously. Fixing them first, before any spec changes, validates the full suite with zero risk of masking pre-existing issues.

---

## 6. Summary of Actions

| Priority | Action | File(s) |
|---|---|---|
| 🔴 Critical | Fix `docsLink` typo (`'Docsss'` → `'Docs'`) | `pages/main-page.ts` |
| 🔴 Critical | Fix `goto()` title regex (`PlaywrightIncorrectTitle` → `Playwright`) | `pages/main-page.ts` |
| 🟠 High | Delete triple-duplicate legacy spec | `tests/main.navigation.spec.ts` |
| 🟠 High | Delete superseded intermediate spec | `tests/main.navigation.refactored.spec.ts` |
| 🟡 Medium | Replace fragile CSS/text selectors with role-based locators | `pages/playwright-dev-page.ts` |
| 🔵 Low | Fill TC-NAV-001-D gap (keyboard-nav test) | `tests/main.navigation.professional.spec.ts` |

Net result after consolidation: **7 tests** (down from 13 in three overlapping files), zero duplication, full coverage retained.

---

## 7. Applied Fixes

The following changes were approved and applied on 2026-03-24.

### `pages/main-page.ts`

| # | Change | Before | After |
|---|---|---|---|
| 1 | Fix `docsLink` selector typo | `getByRole('link', { name: 'Docsss' })` | `getByRole('link', { name: 'Docs' })` |
| 2 | Fix `goto()` title guard regex | `toHaveTitle(/PlaywrightIncorrectTitle/)` | `toHaveTitle(/Playwright/)` |

### `tests/main.navigation.spec.ts`

| # | Change | Before | After |
|---|---|---|---|
| 3 | Remove duplicate describe blocks | 3 identical `test.describe` blocks | 1 block |
| 4 | Rename test title | `"…navigation buttons: Docs…"` | `"…navigation links: Docs…"` |
| 5 | Soften assertions | `expect(…).toBeVisible()` | `expect.soft(…).toBeVisible()` |

### Not applied (pending / out of scope)

| Action | Reason deferred |
|---|---|
| Delete `main.navigation.spec.ts` | Kept — cleaned up in place instead |
| Delete `main.navigation.refactored.spec.ts` | Out of scope for this session |
| Harden `playwright-dev-page.ts` selectors | Out of scope for this session |
| Add TC-NAV-001-D keyboard-nav test | Future work |
