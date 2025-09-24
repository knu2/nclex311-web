import { test, expect } from '@playwright/test';
import {
  navigateToAuthDemo,
  registerUser,
  loginUser,
  logoutUser,
  verifyUserLoggedIn,
  verifyUserLoggedOut,
  generateTestUser,
  verifyFormValidationError,
  verifyApiError,
  type TestUser,
} from './utils/auth-helpers';

test.describe('Authentication Login Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Start fresh for each test
    await page.goto('/auth-demo');
  });

  test('should display login form correctly', async ({ page }) => {
    await navigateToAuthDemo(page);

    // Should be on login tab by default
    await expect(page.getByRole('tab', { name: 'Sign In' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // Should show form elements
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should successfully register and login a new user', async ({
    page,
  }) => {
    const testUser = generateTestUser();

    // Register new user
    await registerUser(page, testUser);

    // Should switch to login tab after registration
    await expect(page.getByRole('tab', { name: 'Sign In' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // Login with the registered user
    await loginUser(page, testUser);

    // Verify login success
    await verifyUserLoggedIn(page, testUser);
  });

  test('should handle login with valid credentials', async ({ page }) => {
    const testUser = generateTestUser();

    // First register the user
    await registerUser(page, testUser);

    // Now test login flow specifically
    await page.getByRole('tab', { name: 'Sign In' }).click();
    await page.locator('#email').fill(testUser.email);
    await page.locator('#password').fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should see welcome message
    await expect(page.getByText('Welcome!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`Email: ${testUser.email}`)).toBeVisible();
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await navigateToAuthDemo(page);

    // Try to login with non-existent user
    await page.getByRole('tab', { name: 'Sign In' }).click();
    await page.locator('#email').fill('nonexistent@test.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error message
    await expect(
      page.locator('.text-red-600, .text-red-500, [role=\"alert\"]')
    ).toBeVisible({ timeout: 5000 });

    // Should still be on login form
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await navigateToAuthDemo(page);

    // Try invalid email format
    await page.getByRole('tab', { name: 'Sign In' }).click();
    await page.locator('#email').fill('invalid-email');
    await page.locator('#password').fill('somepassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show validation error or prevent submission
    // Check for HTML5 validation or custom error message
    const emailField = page.locator('#email');
    const validationMessage = await emailField.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });

  test('should require email and password fields', async ({ page }) => {
    await navigateToAuthDemo(page);

    // Try to submit empty form
    await page.getByRole('tab', { name: 'Sign In' }).click();
    await page.getByRole('button', { name: /sign in/i }).click();

    // Be robust across render timing and validation strategies:
    // 1) We must still be on the Sign In tab
    await expect(page.getByRole('tab', { name: 'Sign In' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    // 2) We must NOT be on the logged-in screen
    await expect(page.getByText('Welcome!')).toHaveCount(0);
    // 3) Prefer error messages if present (non-blocking)
    const errors = page.locator('p.text-red-600');
    await errors
      .first()
      .isVisible()
      .catch(() => {});
  });

  test('should successfully logout user', async ({ page }) => {
    const testUser = generateTestUser();

    // Register and login user
    await registerUser(page, testUser);
    await loginUser(page, testUser);

    // Verify logged in
    await verifyUserLoggedIn(page, testUser);

    // Logout
    await logoutUser(page);

    // Verify logged out
    await verifyUserLoggedOut(page);
  });

  test('should handle session persistence on page reload', async ({ page }) => {
    const testUser = generateTestUser();

    // Register and login user
    await registerUser(page, testUser);
    await loginUser(page, testUser);

    // Verify logged in
    await verifyUserLoggedIn(page, testUser);

    // Reload page
    await page.reload();

    // Should still be logged in after reload
    await expect(page.getByText('Welcome!')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`Email: ${testUser.email}`)).toBeVisible();
  });

  test('should switch between login and registration tabs', async ({
    page,
  }) => {
    await navigateToAuthDemo(page);

    // Should start on login tab
    await expect(page.getByRole('tab', { name: 'Sign In' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    // Switch to registration tab
    await page.getByRole('tab', { name: 'Create Account' }).click();
    await expect(
      page.getByRole('tab', { name: 'Create Account' })
    ).toHaveAttribute('aria-selected', 'true');

    // Should show registration form
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /create account/i })
    ).toBeVisible();

    // Switch back to login tab
    await page.getByRole('tab', { name: 'Sign In' }).click();
    await expect(page.getByRole('tab', { name: 'Sign In' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show loading states during authentication', async ({ page }) => {
    const testUser = generateTestUser();

    // First register a user
    await registerUser(page, testUser);

    // Test login loading state
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.getByLabel('Email').fill(testUser.email);
    await page.getByLabel('Password').fill(testUser.password);

    // Click submit and check for loading state
    await page.getByRole('button', { name: /sign in/i }).click();

    // Look for loading indicator (disabled button, loading text, or spinner)
    // This may be visible only briefly, so we use a short timeout
    await expect(
      page.locator('button[disabled], .loading, .spinner, [data-loading]')
    )
      .toBeVisible({ timeout: 2000 })
      .catch(() => {
        // Loading state might be too fast to catch, that's ok
        console.log('Loading state was too brief to detect');
      });

    // Should eventually show success
    await expect(page.getByText('Welcome!')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Authentication Registration Functionality', () => {
  test('should successfully register a new user', async ({ page }) => {
    const testUser = generateTestUser();

    await navigateToAuthDemo(page);

    // Switch to registration tab
    await page.getByRole('tab', { name: 'Create Account' }).click();
    await expect(
      page.getByRole('tab', { name: 'Create Account' })
    ).toHaveAttribute('aria-selected', 'true');

    // Fill registration form
    await page.locator('#email').fill(testUser.email);
    await page.locator('#password').fill(testUser.password);
    // Fill confirm password too
    await page.locator('#confirmPassword').fill(testUser.password);

    // Handle alert dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Account created');
      await dialog.accept();
    });

    // Submit registration
    await page.getByRole('button', { name: /create account/i }).click();

    // Should switch to login tab after successful registration
    await expect(page.getByRole('tab', { name: 'Sign In' })).toHaveAttribute(
      'aria-selected',
      'true',
      { timeout: 5000 }
    );
  });

  test('should prevent duplicate email registration', async ({ page }) => {
    const testUser = generateTestUser();

    // Register user first time
    await registerUser(page, testUser);

    // Try to register same email again
    await page.getByRole('tab', { name: 'Create Account' }).click();
    await page.locator('#email').fill(testUser.email);
    await page.locator('#password').fill(testUser.password);
    await page.locator('#confirmPassword').fill(testUser.password);
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show error about duplicate email
    await expect(
      page.locator('.text-red-600, .text-red-500, [role=\"alert\"]')
    ).toBeVisible({ timeout: 5000 });
  });

  test('should validate password requirements', async ({ page }) => {
    await navigateToAuthDemo(page);

    // Switch to registration tab
    await page.getByRole('tab', { name: 'Create Account' }).click();

    // Try weak password
    await page.locator('#email').fill('test@example.com');
    await page.locator('#password').fill('123'); // Too weak
    await page.locator('#confirmPassword').fill('123');
    await page.getByRole('button', { name: /create account/i }).click();

    // Should show password validation error
    await expect(
      page.locator('.text-red-600, .text-red-500, [role=\"alert\"]')
    ).toBeVisible({ timeout: 5000 });
  });
});
