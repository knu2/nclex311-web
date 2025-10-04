# Freemium User Flows E2E Test - Update Required

## Status: ⏳ Pending Update

The `freemium-user-flows.spec.ts` file needs significant refactoring to work with the new sidebar-based navigation introduced in the UX redesign.

## Breaking Changes

### 1. **Test: "Guest user can see all chapters and concepts"** (Lines 77-100)

**Current Issues:**

- Lines 78: `await page.goto('/dashboard')` - Dashboard route may not exist or may look different
- Lines 81-82: `await expect(page.getByText('Welcome back!')).toBeVisible()` - This UI element may not exist
- Lines 85-87: Tab-based navigation verification - Tabs don't exist in new design

**Required Changes:**

```typescript
// Replace with:
await page.goto('/chapters');
await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

// Remove tab verification (lines 84-87)

// Update chapter visibility check to use sidebar
const sidebar = page.locator('[role="navigation"]');
await expect(
  sidebar.locator(`text=/Chapter ${testChapters.freeChapter.number}/i`)
).toBeVisible();
await expect(
  sidebar.locator(`text=/Chapter ${testChapters.premiumChapter.number}/i`)
).toBeVisible();
```

---

### 2. **Test: "Guest user can view a free concept in chapter 2"** (Lines 102-189)

**Current Issues:**

- Lines 154-162: Dashboard accordion expansion doesn't exist
- Uses `.locator('text=Chapter').locator('..')` pattern for accordion
- Uses `.getByRole('button').click()` to expand chapter

**Required Changes:**

```typescript
// Replace lines 154-162 with sidebar navigation:
await page.goto('/chapters');

// Mock the sidebar chapter API
await page.route('**/api/chapters/chapter-2/concepts', async route => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      data: {
        id: 'chapter-2',
        title: testChapters.freeChapter.title,
        chapterNumber: 2,
        concepts: [
          {
            id: 'concept-2-1',
            title: testChapters.freeChapter.concepts[0].title,
            slug: testChapters.freeChapter.concepts[0].slug,
            conceptNumber: 1,
            isCompleted: false,
            isPremium: false,
          },
        ],
      },
    }),
  });
});

await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

// Click concept in sidebar
const conceptLink = page
  .locator('[role="navigation\"]')
  .locator('text=' + testChapters.freeChapter.concepts[0].title);
await conceptLink.click();
```

---

### 3. **Test: "Guest user is blocked by paywall..."** (Lines 191-257)

**Similar Issues:**

- Lines 212-220: Same dashboard accordion pattern

**Required Changes:**

- Apply same sidebar navigation pattern as above
- Mock sidebar API for premium chapter
- Update concept selection to use sidebar

---

### 4. **Test: "UI correctly displays lock icons and premium badges"** (Lines 259-289)

**Current Issues:**

- Lines 262-271: Dashboard chapter expansion
- Checks for 'Free'/'Premium' chips in dashboard

**Required Changes:**

```typescript
// Navigate to chapters with sidebar
await page.goto('/chapters');
await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

// Mock both free and premium chapters in sidebar
// (Add mock routes for both chapter APIs)

const sidebar = page.locator('[role="navigation"]');

// Check for premium lock icons in sidebar
const premiumLockIcons = sidebar.locator('[aria-label="Premium content"]');
expect(await premiumLockIcons.count()).toBeGreaterThan(0);

// Free concepts should not have lock icons
const freeConcepts = sidebar.locator(
  'text=' + testChapters.freeChapter.concepts[0].title
);
const lockInFree = freeConcepts.locator('[aria-label="Premium content"]');
expect(await lockInFree.count()).toBe(0);
```

---

## API Mock Updates Required

The tests currently mock:

- `**/api/chapters` - Returns list of chapters for dashboard
- `**/api/concepts/{slug}` - Returns concept data

New mocks needed:

- `**/api/chapters/{chapterId}/concepts` - Returns chapter with concepts for sidebar
  - Should include: id, title, chapterNumber, concepts[]
  - Each concept: id, title, slug, conceptNumber, isCompleted, isPremium

---

## Estimated Effort

**Time to complete:** 60-90 minutes

**Complexity:** High - Requires understanding both old dashboard and new sidebar architecture

**Dependencies:**

- MainLayout component with sidebar
- ConceptList component
- Sidebar API endpoints functional

---

## Recommendation

### Option A: Update Tests Now

- Complete all updates before running test suite
- Ensures comprehensive E2E coverage
- Required for production release

### Option B: Skip for Initial Test Run

- Run other updated tests first (markdown-rendering, concept-viewer, sidebar-navigation)
- Update freemium tests based on actual app behavior observed
- May reveal additional needed changes

---

## Implementation Checklist

- [ ] Update test 1: Guest user can see chapters (remove tabs, add sidebar)
- [ ] Update test 2: View free concept (replace accordion with sidebar)
- [ ] Update test 3: Premium paywall (same sidebar pattern)
- [ ] Update test 4: Visual indicators (sidebar lock icons)
- [ ] Add mock for `/api/chapters/{id}/concepts` endpoint
- [ ] Remove references to dashboard tabs
- [ ] Update all chapter expansion patterns
- [ ] Test sidebar-based concept selection
- [ ] Verify premium/free visual indicators in sidebar
- [ ] Run full test suite and validate

---

**Last Updated:** 2025-10-04  
**Status:** Documentation complete, implementation pending
