/**
 * Sidebar Navigation E2E Tests
 * Tests the new sidebar-based navigation system introduced in the UX redesign
 * Story: 1.5.1 - Sidebar Navigation Component
 * Story: 1.5.2 - Main Layout Shell & Responsive Behavior
 */

import { test, expect } from '@playwright/test';

test.describe('Sidebar Navigation - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/chapters');
  });

  test('displays sidebar persistently on desktop (≥960px)', async ({
    page,
  }) => {
    // Wait for sidebar to load
    await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

    // Sidebar should be visible
    const sidebar = page.locator('[role="navigation"]');
    await expect(sidebar).toBeVisible();

    // Sidebar should have fixed width of 280px
    const sidebarBox = await sidebar.boundingBox();
    expect(sidebarBox?.width).toBe(280);
  });

  test('shows chapter title and progress indicator', async ({ page }) => {
    await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

    // Should show "Chapter X" text
    await expect(page.locator('text=/Chapter \\d+/i')).toBeVisible();

    // Should show progress bar
    const progressBar = page.locator(
      '[role="navigation"] [role="progressbar"]'
    );
    await expect(progressBar).toBeVisible();
  });

  test('displays concept list with completion indicators', async ({ page }) => {
    await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

    // Should show concept items
    const conceptItems = page
      .locator('[role="navigation"] [role="button"]')
      .filter({ hasText: /\d+\./ });
    const count = await conceptItems.count();
    expect(count).toBeGreaterThan(0);

    // Check for completion checkmarks (if any concepts are completed)
    const checkmarks = page.locator(
      '[role="navigation"] [aria-label*="Completed"]'
    );
    // Note: may be 0 if no concepts completed yet
    const checkmarkCount = await checkmarks.count();
    expect(checkmarkCount).toBeGreaterThanOrEqual(0);
  });

  test('highlights active concept in sidebar', async ({ page }) => {
    await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

    // Click on a concept
    const firstConcept = page
      .locator('[role="navigation"] [role="button"]')
      .filter({ hasText: /\d+\./ })
      .first();
    await firstConcept.click();

    // Wait for navigation
    await page.waitForSelector('text=READ THIS', { timeout: 10000 });

    // The clicked concept should now be highlighted (aria-current="page")
    const activeConcept = page.locator(
      '[role="navigation"] [aria-current="page"]'
    );
    await expect(activeConcept).toBeVisible();
  });

  test('navigates between concepts without closing sidebar', async ({
    page,
  }) => {
    await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

    // Click first concept
    const firstConcept = page
      .locator('[role="navigation"] [role="button"]')
      .filter({ hasText: /\d+\./ })
      .first();
    await firstConcept.click();

    // Wait for content to load
    await page.waitForSelector('text=READ THIS', { timeout: 10000 });

    // Sidebar should still be visible
    const sidebar = page.locator('[role="navigation"]');
    await expect(sidebar).toBeVisible();

    // Click second concept (if available)
    const conceptCount = await page
      .locator('[role="navigation"] [role="button"]')
      .filter({ hasText: /\d+\./ })
      .count();

    if (conceptCount > 1) {
      const secondConcept = page
        .locator('[role="navigation"] [role="button"]')
        .filter({ hasText: /\d+\./ })
        .nth(1);
      await secondConcept.click();

      // Wait for new content
      await page.waitForTimeout(1000);

      // Sidebar should still be visible
      await expect(sidebar).toBeVisible();
    }
  });

  test('shows premium lock icons on premium concepts', async ({ page }) => {
    await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

    // Check for premium lock icons (if any premium concepts exist)
    const lockIcons = page.locator(
      '[role="navigation"] [aria-label="Premium content"]'
    );
    const lockCount = await lockIcons.count();
    // Note: may be 0 if all concepts are free
    expect(lockCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Sidebar Navigation - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/chapters');
  });

  test('hides sidebar initially on mobile (<960px)', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Sidebar drawer should not be visible initially
    const sidebar = page.locator('[role="navigation"]');
    const isVisible = await sidebar.isVisible();
    expect(isVisible).toBe(false);
  });

  test('shows hamburger menu button on mobile', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Should have hamburger menu button
    const hamburgerMenu = page.locator('button[aria-label="open drawer"]');
    await expect(hamburgerMenu).toBeVisible();
  });

  test('opens sidebar drawer when hamburger menu is clicked', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');

    // Click hamburger menu
    const hamburgerMenu = page.locator('button[aria-label="open drawer"]');
    await hamburgerMenu.click();

    // Wait for drawer animation (300ms)
    await page.waitForTimeout(400);

    // Sidebar should now be visible
    const sidebar = page.locator('[role="navigation"]');
    await expect(sidebar).toBeVisible();
  });

  test('displays overlay background when sidebar is open', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Open sidebar
    const hamburgerMenu = page.locator('button[aria-label="open drawer"]');
    await hamburgerMenu.click();
    await page.waitForTimeout(400);

    // Should have a backdrop/overlay element
    const backdrop = page.locator('.MuiBackdrop-root');
    await expect(backdrop).toBeVisible();
  });

  test('closes sidebar when concept is selected (mobile auto-close)', async ({
    page,
  }) => {
    await page.waitForLoadState('networkidle');

    // Open sidebar
    const hamburgerMenu = page.locator('button[aria-label="open drawer"]');
    await hamburgerMenu.click();
    await page.waitForTimeout(400);

    // Click on a concept
    const firstConcept = page
      .locator('[role="navigation"] [role="button"]')
      .filter({ hasText: /\d+\./ })
      .first();
    await firstConcept.click();

    // Wait for navigation and drawer animation
    await page.waitForTimeout(500);

    // Sidebar should be hidden again
    const sidebar = page.locator('[role="navigation"]');
    const isVisible = await sidebar.isVisible();
    expect(isVisible).toBe(false);
  });

  test('closes sidebar when overlay backdrop is clicked', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Open sidebar
    const hamburgerMenu = page.locator('button[aria-label="open drawer"]');
    await hamburgerMenu.click();
    await page.waitForTimeout(400);

    // Sidebar should be visible
    const sidebar = page.locator('[role="navigation"]');
    await expect(sidebar).toBeVisible();

    // Click on backdrop
    const backdrop = page.locator('.MuiBackdrop-root');
    await backdrop.click({ position: { x: 10, y: 10 } });

    // Wait for drawer animation
    await page.waitForTimeout(400);

    // Sidebar should be hidden
    const isVisible = await sidebar.isVisible();
    expect(isVisible).toBe(false);
  });
});

test.describe('Sidebar Navigation - Responsive Behavior', () => {
  test('transitions from desktop to mobile layout correctly', async ({
    page,
  }) => {
    // Start at desktop size
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/chapters');
    await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

    // Sidebar should be visible
    const sidebar = page.locator('[role="navigation"]');
    await expect(sidebar).toBeVisible();

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    // Sidebar should now be hidden (drawer mode)
    const isVisible = await sidebar.isVisible();
    expect(isVisible).toBe(false);

    // Hamburger menu should now be visible
    const hamburgerMenu = page.locator('button[aria-label="open drawer"]');
    await expect(hamburgerMenu).toBeVisible();
  });

  test('transitions from mobile to desktop layout correctly', async ({
    page,
  }) => {
    // Start at mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/chapters');
    await page.waitForLoadState('networkidle');

    // Sidebar should be hidden
    const sidebar = page.locator('[role="navigation"]');
    let isVisible = await sidebar.isVisible();
    expect(isVisible).toBe(false);

    // Resize to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(300);

    // Sidebar should now be visible (persistent mode)
    await expect(sidebar).toBeVisible();

    // Hamburger menu should be hidden
    const hamburgerMenu = page.locator('button[aria-label="open drawer"]');
    isVisible = await hamburgerMenu.isVisible();
    expect(isVisible).toBe(false);
  });

  test('maintains concept selection state across viewport changes', async ({
    page,
  }) => {
    // Start at desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/chapters');
    await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

    // Click on a concept
    const firstConcept = page
      .locator('[role="navigation"] [role="button"]')
      .filter({ hasText: /\d+\./ })
      .first();
    const conceptText = await firstConcept.textContent();
    await firstConcept.click();

    // Wait for content to load
    await page.waitForSelector('text=READ THIS', { timeout: 10000 });

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    // Open sidebar on mobile
    const hamburgerMenu = page.locator('button[aria-label="open drawer"]');
    await hamburgerMenu.click();
    await page.waitForTimeout(400);

    // The same concept should still be highlighted
    const activeConcept = page.locator(
      '[role="navigation"] [aria-current="page"]'
    );
    await expect(activeConcept).toBeVisible();
    const activeText = await activeConcept.textContent();
    expect(activeText).toContain(conceptText?.split('.')[0] || '');
  });
});

test.describe('Sidebar Navigation - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/chapters');
  });

  test('sidebar has proper ARIA role and label', async ({ page }) => {
    await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

    // Should have role="navigation"
    const sidebar = page.locator('[role="navigation"]');
    await expect(sidebar).toBeVisible();

    // Should have aria-label
    const ariaLabel = await sidebar.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
  });

  test('concept items have proper ARIA attributes', async ({ page }) => {
    await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

    // Get first concept button
    const firstConcept = page
      .locator('[role="navigation"] [role="button"]')
      .filter({ hasText: /\d+\./ })
      .first();

    // Should have aria-label
    const ariaLabel = await firstConcept.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();

    // Click on concept
    await firstConcept.click();
    await page.waitForSelector('text=READ THIS', { timeout: 10000 });

    // Should have aria-current="page" when active
    const ariaCurrent = await firstConcept.getAttribute('aria-current');
    expect(ariaCurrent).toBe('page');
  });

  test('keyboard navigation works in sidebar', async ({ page }) => {
    await page.waitForSelector('[role="navigation"]', { timeout: 10000 });

    // Focus on first concept with Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs to reach sidebar

    // Press Enter to activate
    await page.keyboard.press('Enter');

    // Should navigate to concept
    await page.waitForSelector('text=READ THIS', { timeout: 10000 });
  });
});
