import { test, expect } from '@playwright/test';
import { generateTestUser, navigateToAuthDemo } from './utils/auth-helpers';

test('debug login flow', async ({ page }) => {
  const testUser = generateTestUser();

  // Enable console logging
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await navigateToAuthDemo(page);

  console.log('Step 1: Navigate to registration tab');
  await page.getByRole('tab', { name: 'Create Account' }).click();
  await expect(
    page.getByRole('tab', { name: 'Create Account' })
  ).toHaveAttribute('aria-selected', 'true');

  console.log('Step 2: Fill registration form');
  await page.locator('#email').fill(testUser.email);
  await page.locator('#password').fill(testUser.password);
  await page.locator('#confirmPassword').fill(testUser.password);

  // Handle alert dialog
  page.on('dialog', async dialog => {
    console.log('ALERT:', dialog.message());
    await dialog.accept();
  });

  console.log('Step 3: Submit registration');
  await page.getByRole('button', { name: /create account/i }).click();

  console.log('Step 4: Wait for tab switch');
  await expect(page.getByRole('tab', { name: 'Sign In' })).toHaveAttribute(
    'aria-selected',
    'true',
    { timeout: 10000 }
  );
  console.log('Registration completed, now on login tab');

  console.log('Step 5: Fill login form');
  await page.locator('#email').fill(testUser.email);
  await page.locator('#password').fill(testUser.password);

  console.log('Step 6: Submit login');
  await page.getByRole('button', { name: /sign in/i }).click();

  console.log('Step 7: Wait for login completion');

  // Wait a bit and see what's on the page
  await page.waitForTimeout(3000);

  // Check if we're still on the login form or if something else happened
  const pageContent = await page.textContent('body');
  console.log(
    'Page content after login attempt:',
    pageContent?.substring(0, 200) + '...'
  );

  // Check for error messages
  const errorMessages = await page
    .locator('.text-red-600, .text-red-500, [role="alert"]')
    .allTextContents();
  if (errorMessages.length > 0) {
    console.log('Error messages found:', errorMessages);
  }

  // Check if we can find the welcome message
  const welcomeVisible = await page
    .getByText('Welcome!')
    .isVisible()
    .catch(() => false);
  console.log('Welcome message visible:', welcomeVisible);

  if (!welcomeVisible) {
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-login-failed.png', fullPage: true });
    console.log('Screenshot saved as debug-login-failed.png');
  }
});
