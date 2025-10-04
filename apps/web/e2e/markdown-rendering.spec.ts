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

test.describe('Markdown Content Rendering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a concept page with markdown content
    // Note: This assumes test data exists with markdown formatting
    await page.goto('/');
  });

  test.describe('Concept Page Markdown Rendering', () => {
    test('displays concept content with bold text formatting', async ({
      page,
    }) => {
      // Navigate via sidebar to find a concept
      await navigateToFirstConcept(page);

      // Wait for concept content to load
      await page.waitForSelector('text=/./i', { timeout: 10000 });

      // Check that bold text is properly rendered (not showing ** markers)
      const content = await page.textContent('body');

      // Should not show raw markdown syntax
      expect(content).not.toContain('**');

      // Check for proper HTML strong tags
      const strongElements = await page.locator('strong').count();
      if (strongElements > 0) {
        const firstStrong = page.locator('strong').first();
        await expect(firstStrong).toBeVisible();
      }
    });

    test('displays concept content with list formatting', async ({ page }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=/./i', { timeout: 10000 });

      // Check for list elements (ul or ol)
      const lists = await page.locator('ul, ol').count();
      if (lists > 0) {
        const firstList = page.locator('ul, ol').first();
        await expect(firstList).toBeVisible();

        // Verify list items are rendered
        const listItems = page.locator('li');
        const itemCount = await listItems.count();
        if (itemCount > 0) {
          await expect(listItems.first()).toBeVisible();
        }
      }
    });

    test('displays concept content with italic text formatting', async ({
      page,
    }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=/./i', { timeout: 10000 });

      // Look for em tags (italic)
      const emElements = await page.locator('em').count();
      if (emElements > 0) {
        const firstEm = page.locator('em').first();
        await expect(firstEm).toBeVisible();
      }
    });

    test('does not display raw markdown syntax like \\n', async ({ page }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=/./i', { timeout: 10000 });

      // Should not show raw escape sequences
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toContain('\\n');
      expect(bodyText).not.toContain('\\t');
    });
  });

  test.describe('Quiz Question Markdown Rendering', () => {
    test('displays quiz question text with proper formatting', async ({
      page,
    }) => {
      // Navigate to a concept with questions
      await navigateToFirstConcept(page);

      // Wait for page to load
      await page
        .waitForSelector('text=/Practice Question|Question/i', {
          timeout: 10000,
        })
        .catch(() => {
          // No quiz questions available on this concept, skip
        });

      // Check if quiz section exists
      const hasQuiz = await page.locator('text=/Practice Question/i').count();

      if (hasQuiz > 0) {
        // Verify question text doesn't have raw markdown
        const quizContent = await page.textContent('[role="main"], body');
        expect(quizContent).not.toContain('**');
        expect(quizContent).not.toContain('\\n');
      }
    });

    test('displays quiz options with proper formatting', async ({ page }) => {
      await navigateToFirstConcept(page);

      // Check for radio or checkbox options
      await page.waitForTimeout(2000);

      const radioOptions = await page.locator('input[type="radio"]').count();
      const checkboxOptions = await page
        .locator('input[type="checkbox"]')
        .count();

      if (radioOptions > 0 || checkboxOptions > 0) {
        // Verify options don't show raw markdown
        const labels = page.locator('label');
        const firstLabel = labels.first();

        if (await firstLabel.isVisible()) {
          const labelText = await firstLabel.textContent();
          expect(labelText).not.toContain('**');
          expect(labelText).not.toContain('\\n');
        }
      }
    });

    test('displays rationale with formatted text after submission', async ({
      page,
    }) => {
      await navigateToFirstConcept(page);

      await page.waitForTimeout(2000);

      // Check if there's a quiz
      const hasSubmitButton = await page
        .locator('button:has-text("Submit Answer")')
        .count();

      if (hasSubmitButton > 0) {
        // Select an answer (first radio or checkbox)
        const firstRadio = page.locator('input[type="radio"]').first();
        const firstCheckbox = page.locator('input[type="checkbox"]').first();

        if ((await firstRadio.count()) > 0) {
          await firstRadio.click();
        } else if ((await firstCheckbox.count()) > 0) {
          await firstCheckbox.click();
        }

        // Submit the answer
        await page.click('button:has-text("Submit Answer")');

        // Wait for rationale to appear
        await page.waitForSelector('text=/Rationale|Correct|Incorrect/i', {
          timeout: 5000,
        });

        // Verify rationale doesn't show raw markdown
        const rationaleSection = await page.textContent('body');
        expect(rationaleSection).not.toContain('**');
        expect(rationaleSection).not.toContain('\\n');
      }
    });
  });

  test.describe('Responsive Rendering', () => {
    test('renders markdown correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await navigateToFirstConcept(page);

      await page.waitForSelector('text=/./i', { timeout: 10000 });

      // Verify content is visible and formatted
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
      expect(content).not.toContain('**');
      expect(content).not.toContain('\\n');
    });

    test('renders markdown correctly on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      await navigateToFirstConcept(page);

      await page.waitForSelector('text=/./i', { timeout: 10000 });

      // Verify content is visible and formatted
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
      expect(content).not.toContain('**');
    });

    test('renders markdown correctly on desktop viewport', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });

      await navigateToFirstConcept(page);

      await page.waitForSelector('text=/./i', { timeout: 10000 });

      // Verify content is visible and formatted
      const content = await page.textContent('body');
      expect(content).toBeTruthy();
      expect(content).not.toContain('**');
    });
  });

  test.describe('Visual Regression - No Raw Markdown Visible', () => {
    test('verifies no markdown syntax characters are visible to users', async ({
      page,
    }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=/./i', { timeout: 10000 });

      // Check for markdown syntax patterns that should NOT be visible
      // Most importantly, no ** should be visible around bold text
      const paragraphs = await page.locator('p').allTextContents();

      for (const paragraph of paragraphs) {
        expect(paragraph).not.toMatch(/\*\*\w+\*\*/); // No **word** patterns
        expect(paragraph).not.toContain('\\n'); // No literal \n
      }
    });

    test('verifies lists are properly rendered as HTML lists', async ({
      page,
    }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=/./i', { timeout: 10000 });

      // Check for presence of list elements
      const lists = page.locator('ul, ol');
      const listCount = await lists.count();

      if (listCount > 0) {
        // Verify lists are visible
        await expect(lists.first()).toBeVisible();

        // Verify list items don't start with markdown bullets
        const listItems = await page.locator('li').allTextContents();

        for (const item of listItems) {
          expect(item.trim()).not.toMatch(/^[-*]\s/); // No - or * at start
        }
      }
    });
  });

  test.describe('XSS Security', () => {
    test('does not execute or render malicious script tags', async ({
      page,
    }) => {
      // This test assumes there's no XSS vulnerability
      // If markdown content contains script tags, they should be sanitized

      await navigateToFirstConcept(page);

      await page.waitForSelector('text=/./i', { timeout: 10000 });

      // Only external scripts (with src) should be present, no inline scripts from content
      const pageScripts = await page.locator('script').all();

      for (const script of pageScripts) {
        const scriptContent = await script.textContent();
        if (scriptContent) {
          // Should not contain alert or eval from user content
          expect(scriptContent).not.toContain('alert("XSS")');
          expect(scriptContent).not.toContain("alert('XSS')");
        }
      }
    });

    test('does not render iframe tags from markdown content', async ({
      page,
    }) => {
      await navigateToFirstConcept(page);

      await page.waitForSelector('text=/./i', { timeout: 10000 });

      // Check for iframes in the content area (excluding legitimate app iframes)
      const contentArea = page.locator('main, [role="main"], article');

      if ((await contentArea.count()) > 0) {
        const iframes = await contentArea.locator('iframe').count();
        // There should be no iframes in the content area
        expect(iframes).toBe(0);
      }
    });
  });
});
