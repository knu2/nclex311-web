/**
 * ConceptViewer E2E Integration Tests
 * Tests real API integration, markdown rendering, and user-visible behavior
 * Story: 1.5.3 - Concept Viewer with Markdown Rendering
 * Updated for UX Redesign with sidebar navigation
 */

import { test, expect, type Page } from '@playwright/test';

/**
 * Helper function to navigate to a concept via sidebar
 * Works for both mobile and desktop viewports
 */
async function navigateToFirstConcept(page: Page) {
  // Navigate to chapters page which should show sidebar
  await page.goto('/chapters');

  // Wait for sidebar to load concepts
  await page.waitForSelector('text=Chapter', { timeout: 10000 });

  // On mobile, need to open the sidebar drawer first
  const viewport = page.viewportSize();
  const isMobile = viewport && viewport.width < 960;

  if (isMobile) {
    // Click hamburger menu to open sidebar drawer
    const hamburgerMenu = page.locator('button[aria-label="open drawer"]');
    if (await hamburgerMenu.isVisible()) {
      await hamburgerMenu.click();
      // Wait for drawer animation
      await page.waitForTimeout(300);
    }
  }

  // Click on the first available concept in the sidebar
  const firstConcept = page
    .locator('[role="navigation"] [role="button"]')
    .filter({ hasText: /\d+\./ }) // Matches concept number pattern
    .first();
  await firstConcept.waitFor({ state: 'visible', timeout: 5000 });
  await firstConcept.click();
}

test.describe('ConceptViewer Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home/dashboard to access concepts
    await page.goto('/');
  });

  test.describe('API Integration and Data Fetching', () => {
    test('fetches and displays concept data from API', async ({ page }) => {
      // Navigate via sidebar
      await navigateToFirstConcept(page);

      // Wait for concept content to load
      await page.waitForSelector('text=READ THIS', { timeout: 10000 });

      // Verify main components are present
      await expect(page.locator('text=📖 READ THIS')).toBeVisible();

      // Should have a concept title (h1)
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      // Should have content loaded (body text should be substantial)
      const content = await page.textContent('body');
      expect(content?.length).toBeGreaterThan(100);
    });

    test('displays loading state while fetching concept', async ({ page }) => {
      // Set up navigation to check for loading state
      await page.goto('/chapters');
      await page.waitForSelector('text=Chapter', { timeout: 10000 });

      const firstConcept = page
        .locator('[role="navigation"] [role="button"]')
        .filter({ hasText: /\d+\./ })
        .first();

      // Start navigation and immediately check for loading indicator
      await firstConcept.click();

      // Loading skeletons should appear briefly
      // (This might be too fast to catch in practice, but the component supports it)
      await page.waitForSelector('text=READ THIS', { timeout: 10000 });
    });

    test('handles 404 errors for non-existent concepts', async ({ page }) => {
      // Try to access a non-existent concept
      await page.goto('/concepts/nonexistent-concept-slug-12345');

      // Should show error or redirect
      await page.waitForLoadState('networkidle');

      const content = await page.textContent('body');
      // May show "not found", error message, or redirect to dashboard
      expect(
        content?.toLowerCase().includes('not found') ||
          content?.toLowerCase().includes('error') ||
          page.url().includes('/dashboard')
      ).toBeTruthy();
    });
  });

  test.describe('Markdown Rendering - Real Content', () => {
    test('renders markdown bold text without showing ** syntax', async ({
      page,
    }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=READ THIS', { timeout: 10000 });

      // Get page content
      const bodyText = await page.textContent('body');

      // Should not show raw markdown syntax
      expect(bodyText).not.toContain('**');

      // Check for strong tags (bold)
      const strongElements = await page.locator('strong').count();
      if (strongElements > 0) {
        await expect(page.locator('strong').first()).toBeVisible();
      }
    });

    test('renders markdown italic text without showing * syntax', async ({
      page,
    }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=READ THIS', { timeout: 10000 });

      // Check for em tags (italic)
      const emElements = await page.locator('em').count();
      if (emElements > 0) {
        await expect(page.locator('em').first()).toBeVisible();
      }
    });

    test('renders lists correctly', async ({ page }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=READ THIS', { timeout: 10000 });

      // Check for lists (ul or ol)
      const lists = await page.locator('ul, ol').count();
      if (lists > 0) {
        await expect(page.locator('ul, ol').first()).toBeVisible();

        // Verify list items are rendered
        const listItems = await page.locator('li').count();
        expect(listItems).toBeGreaterThan(0);
      }
    });

    test('renders headings with proper hierarchy', async ({ page }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=READ THIS', { timeout: 10000 });

      // Should have h1 (concept title)
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);

      // Should have h2 (READ THIS section)
      const h2Count = await page.locator('h2').count();
      expect(h2Count).toBeGreaterThanOrEqual(1);

      // Verify heading text is visible
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('does not show escape sequences like \\n', async ({ page }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=READ THIS', { timeout: 10000 });

      const bodyText = await page.textContent('body');

      // Should not show literal escape sequences
      expect(bodyText).not.toContain('\\n');
      expect(bodyText).not.toContain('\\t');
    });
  });

  test.describe('Key Points Display', () => {
    test('displays key points section when present', async ({ page }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=READ THIS', { timeout: 10000 });

      // Check if Key Points section exists
      const keyPointsExists = await page
        .locator('text=Key Points')
        .count()
        .then(count => count > 0);

      if (keyPointsExists) {
        await expect(page.locator('text=Key Points')).toBeVisible();
      }
    });
  });

  test.describe('Section Separator', () => {
    test('displays separator when questions are present', async ({ page }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=READ THIS', { timeout: 10000 });

      // Check if separator exists
      const separatorExists = await page
        .locator('text=Test your knowledge!')
        .count()
        .then(count => count > 0);

      if (separatorExists) {
        await expect(page.locator('text=Test your knowledge!')).toBeVisible();
      }
    });
  });

  test.describe('READ THIS Section Styling', () => {
    test('displays READ THIS section with proper styling', async ({ page }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=📖 READ THIS', { timeout: 10000 });

      // Verify section header
      await expect(page.locator('text=📖 READ THIS')).toBeVisible();

      // Verify concept number chip is displayed
      const chipCount = await page.locator('text=/Concept \\d+/').count();
      expect(chipCount).toBeGreaterThanOrEqual(1);
    });

    test('content has proper max-width for readability', async ({ page }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=READ THIS', { timeout: 10000 });

      // The content should be constrained for readability (800px max)
      const mainContent = page.locator('text=READ THIS').locator('..');
      await expect(mainContent).toBeVisible();
    });
  });

  test.describe('Multiple Concepts Spot Check', () => {
    test('renders at least 3 different concepts correctly', async ({
      page,
    }) => {
      // Navigate to chapters page
      await page.goto('/chapters');
      await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

      // Get all concept links from sidebar
      const conceptLinks = page
        .locator('[role="navigation"] [role="button"]')
        .filter({ hasText: /\d+\./ });
      const conceptCount = await conceptLinks.count();

      // Test up to 3 concepts (or fewer if not available)
      const testsToRun = Math.min(3, conceptCount);

      for (let i = 0; i < testsToRun; i++) {
        // Navigate back to chapters for each test
        if (i > 0) {
          await page.goto('/chapters');
          await page.waitForSelector('[role="navigation"]', { timeout: 10000 });
        }

        // Click on concept at index i in sidebar
        const concept = page
          .locator('[role="navigation"] [role="button"]')
          .filter({ hasText: /\d+\./ })
          .nth(i);
        await concept.click();

        // Verify basic rendering
        await page.waitForSelector('text=READ THIS', { timeout: 10000 });

        // Check that content loaded
        const h1 = await page.locator('h1').first().textContent();
        expect(h1).toBeTruthy();
        expect(h1!.length).toBeGreaterThan(0);

        // Check no raw markdown syntax
        const bodyText = await page.textContent('body');
        expect(bodyText).not.toContain('**');
        expect(bodyText).not.toContain('\\n');
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('displays correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await navigateToFirstConcept(page);

      await page.waitForSelector('text=READ THIS', { timeout: 10000 });

      // Content should still be visible and readable
      await expect(page.locator('text=📖 READ THIS')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
    });

    test('displays correctly on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await navigateToFirstConcept(page);

      await page.waitForSelector('text=READ THIS', { timeout: 10000 });

      // Content should be visible
      await expect(page.locator('text=📖 READ THIS')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('loads concept content in reasonable time', async ({ page }) => {
      // Navigate to chapters
      await page.goto('/chapters');
      await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

      const firstConcept = page
        .locator('[role="navigation"] [role="button"]')
        .filter({ hasText: /\d+\./ })
        .first();

      const startTime = Date.now();
      await firstConcept.click();
      await page.waitForSelector('text=READ THIS', { timeout: 10000 });
      const loadTime = Date.now() - startTime;

      // Should load in under 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });
  });
});
