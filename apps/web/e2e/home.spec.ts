import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page title is correct
  await expect(page).toHaveTitle(/NCLEX311/);
  
  // Check that the main content is visible
  await expect(page.locator('main')).toBeVisible();
});

test('health check API returns successful response', async ({ page }) => {
  const response = await page.request.get('/api/health');
  
  expect(response.status()).toBe(200);
  
  const data = await response.json();
  expect(data).toHaveProperty('status', 'healthy');
});
