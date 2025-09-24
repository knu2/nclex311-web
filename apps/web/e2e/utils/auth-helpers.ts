import { Page, expect } from '@playwright/test';

/**
 * Test utilities for authentication flows in E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  name?: string;
}

/**
 * Default test user for authentication tests
 */
export const TEST_USER: TestUser = {
  email: `test-${Date.now()}@playwright.test.com`,
  password: 'TestPassword123!',
  name: 'Test User',
};

/**
 * Navigate to the auth demo page
 */
export async function navigateToAuthDemo(page: Page) {
  await page.goto('/auth-demo');
  await expect(page.locator('h1')).toContainText('NCLEX 311');
}

/**
 * Register a new user via the registration form
 */
export async function registerUser(page: Page, user: TestUser = TEST_USER) {
  await navigateToAuthDemo(page);

  // Click on the registration tab
  await page.getByRole('tab', { name: 'Create Account' }).click();

  // Fill out the registration form - be more specific
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);
  await page.locator('#confirmPassword').fill(user.password);

  if (user.name) {
    const nameField = page.getByLabel('Name');
    if (await nameField.isVisible()) {
      await nameField.fill(user.name);
    }
  }

  // Handle potential alert dialog
  page.on('dialog', async dialog => {
    await dialog.accept();
  });

  // Submit the form
  await page.getByRole('button', { name: /create account/i }).click();

  // Wait for registration to complete (should switch to login tab)
  await expect(page.getByRole('tab', { name: 'Sign In' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
}

/**
 * Login with user credentials via the login form
 */
export async function loginUser(page: Page, user: TestUser = TEST_USER) {
  await navigateToAuthDemo(page);

  // Ensure we're on the login tab
  await page.getByRole('tab', { name: 'Sign In' }).click();

  // Fill out the login form using IDs to be specific
  await page.locator('#email').fill(user.email);
  await page.locator('#password').fill(user.password);

  // Submit the form
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for login to complete - should see welcome message
  await expect(page.getByText('Welcome!')).toBeVisible({ timeout: 10000 });
  // Disambiguate: assert the labeled email line specifically
  const emailRegex = new RegExp(`^Email:\\s*${escapeRegExp(user.email)}$`);
  await expect(page.getByText(emailRegex)).toBeVisible();
}

/**
 * Logout the current user
 */
export async function logoutUser(page: Page) {
  // Should be on the auth demo page and logged in
  await expect(page.getByText('Welcome!')).toBeVisible();

  // Click sign out button
  await page.getByRole('button', { name: 'Sign Out' }).click();

  // Should be back to login/register form
  await expect(page.getByRole('tab', { name: 'Sign In' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Create Account' })).toBeVisible();
}

/**
 * Verify user is logged in with correct information displayed
 */
export async function verifyUserLoggedIn(
  page: Page,
  user: TestUser = TEST_USER
) {
  await expect(page.getByText('Welcome!')).toBeVisible();
  const emailRegex = new RegExp(`^Email:\\s*${escapeRegExp(user.email)}$`);
  await expect(page.getByText(emailRegex)).toBeVisible();
  // Name may mirror email depending on provider; do not assert rigidly here
  // Should have sign out button
  await expect(page.getByRole('button', { name: 'Sign Out' })).toBeVisible();
}

/**
 * Verify user is logged out (on login/register form)
 */
export async function verifyUserLoggedOut(page: Page) {
  await expect(page.getByRole('tab', { name: 'Sign In' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Create Account' })).toBeVisible();
  await expect(
    page.getByText('Sign in to your account or create a new one')
  ).toBeVisible();
}

/**
 * Generate a unique test user for isolation between tests
 */
export function generateTestUser(): TestUser {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}-${Math.random().toString(36).substring(7)}@playwright.test.com`,
    password: 'TestPassword123!',
    name: `Test User ${timestamp}`,
  };
}

/**
 * Clean up test data - attempt to delete user via API if needed
 * Note: This is optional since we use unique emails per test
 */
export async function cleanupTestUser(page: Page, user: TestUser) {
  // For now, we rely on unique emails per test run
  // In the future, we could add an admin API endpoint to delete test users
  console.log(`Test cleanup: Used test user ${user.email}`);
}

/**
 * Verify form validation errors are displayed
 */
export async function verifyFormValidationError(
  page: Page,
  expectedError: string
) {
  await expect(page.getByText(expectedError)).toBeVisible();
}

/**
 * Verify API error messages are displayed
 */
export async function verifyApiError(page: Page, expectedError: string) {
  // Look for error messages in the UI
  await expect(
    page.locator('[role="alert"], .text-red-600, .text-red-500')
  ).toContainText(expectedError);
}

// Utility to escape user-provided strings in a regex
function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
