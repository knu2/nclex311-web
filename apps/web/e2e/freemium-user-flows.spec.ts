/**
 * E2E tests for freemium user flows and visual indicators
 * Tests the complete user journey as specified in front-end-spec.md user flows
 */

import { test, expect } from '@playwright/test';

test.describe('Freemium User Flows', () => {
  const testChapters = {
    freeChapter: {
      number: 2,
      title: 'Patient Care Fundamentals',
      concepts: [
        {
          title: 'Pain Assessment',
          slug: 'pain-assessment',
        },
      ],
    },
    premiumChapter: {
      number: 5,
      title: 'Advanced Cardiac Care',
      concepts: [
        {
          title: 'Advanced Arrhythmia Management',
          slug: 'advanced-arrhythmia-management',
        },
      ],
    },
  };

  test.beforeEach(async ({ page }) => {
    // Mock API responses for consistent testing
    await page.route('**/api/chapters', async route => {
      const mockChapters = [
        {
          id: 'chapter-2',
          chapterNumber: 2,
          title: testChapters.freeChapter.title,
          concepts: [
            {
              id: 'concept-2-1',
              title: testChapters.freeChapter.concepts[0].title,
              slug: testChapters.freeChapter.concepts[0].slug,
              conceptNumber: 1,
              isPremium: false,
            },
          ],
        },
        {
          id: 'chapter-5',
          chapterNumber: 5,
          title: testChapters.premiumChapter.title,
          concepts: [
            {
              id: 'concept-5-1',
              title: testChapters.premiumChapter.concepts[0].title,
              slug: testChapters.premiumChapter.concepts[0].slug,
              conceptNumber: 1,
              isPremium: true,
            },
          ],
        },
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockChapters,
        }),
      });
    });
  });

  test('Guest user can see all chapters and concepts', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait for content to load
    await expect(page.getByText('Welcome back!')).toBeVisible();
    await expect(page.getByText('Loading chapters...')).not.toBeVisible();

    // Verify All Concepts tab is active by default
    await expect(
      page.getByRole('tab', { name: 'All Concepts' })
    ).toHaveAttribute('aria-selected', 'true');

    // Verify both free and premium chapters are visible
    await expect(
      page.getByText(
        `Chapter ${testChapters.freeChapter.number}: ${testChapters.freeChapter.title}`
      )
    ).toBeVisible();
    await expect(
      page.getByText(
        `Chapter ${testChapters.premiumChapter.number}: ${testChapters.premiumChapter.title}`
      )
    ).toBeVisible();
  });

  test('Guest user can view a free concept in chapter 2', async ({ page }) => {
    // Mock the free concept API response
    await page.route(
      `**/api/concepts/${testChapters.freeChapter.concepts[0].slug}`,
      async route => {
        const mockConcept = {
          id: 'concept-2-1',
          title: testChapters.freeChapter.concepts[0].title,
          slug: testChapters.freeChapter.concepts[0].slug,
          content:
            'This is a comprehensive guide to pain assessment in nursing practice.',
          conceptNumber: 1,
          chapter: {
            id: 'chapter-2',
            chapterNumber: testChapters.freeChapter.number,
            title: testChapters.freeChapter.title,
          },
          questions: [
            {
              id: 'question-1',
              questionText:
                'What is the most important aspect of pain assessment?',
              questionType: 'MULTIPLE_CHOICE',
              explanation:
                'Patient self-report is the gold standard for pain assessment.',
              options: [
                {
                  id: 'option-1',
                  text: 'Patient self-report',
                  isCorrect: true,
                  orderIndex: 0,
                },
                {
                  id: 'option-2',
                  text: 'Vital signs changes',
                  isCorrect: false,
                  orderIndex: 1,
                },
              ],
            },
          ],
          isPremium: false,
        };

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: mockConcept }),
        });
      }
    );

    await page.goto('/dashboard');
    await expect(page.getByText('Loading chapters...')).not.toBeVisible();

    // Expand free chapter and click on concept
    const freeChapter = page
      .locator(`text=Chapter ${testChapters.freeChapter.number}:`)
      .locator('..');
    await freeChapter.getByRole('button').click();
    await page.getByText(testChapters.freeChapter.concepts[0].title).click();

    // Following user flow: User reads concept text
    await expect(page.getByText('Loading concept...')).not.toBeVisible();
    await expect(
      page.getByRole('heading', {
        name: testChapters.freeChapter.concepts[0].title,
      })
    ).toBeVisible();

    // Verify 'Free' chip is shown
    await expect(page.getByText('Free')).toBeVisible();

    // Following user flow: User starts quiz
    await expect(
      page.getByRole('heading', { name: 'Practice Questions' })
    ).toBeVisible();

    // Answer the question and get immediate feedback
    await page.getByText('Patient self-report').click();
    await page.getByRole('button', { name: 'Submit Answer' }).click();

    // Following user flow: Show immediate Correct/Incorrect feedback
    await expect(page.getByText('Correct!')).toBeVisible();

    // Following user flow: Display detailed rationale
    await expect(page.getByText('Rationale:')).toBeVisible();
  });

  test('Guest user is blocked by paywall when trying to view premium concept in chapter 5', async ({
    page,
  }) => {
    // Mock the premium concept API response with 403 error
    await page.route(
      `**/api/concepts/${testChapters.premiumChapter.concepts[0].slug}`,
      async route => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Premium access required',
            premiumRequired: true,
            chapterNumber: testChapters.premiumChapter.number,
            message: `This concept is part of Chapter ${testChapters.premiumChapter.number} which requires a premium subscription.`,
          }),
        });
      }
    );

    await page.goto('/dashboard');
    await expect(page.getByText('Loading chapters...')).not.toBeVisible();

    // Expand premium chapter and click on concept
    const premiumChapter = page
      .locator(`text=Chapter ${testChapters.premiumChapter.number}:`)
      .locator('..');
    await premiumChapter.getByRole('button').click();
    await page.getByText(testChapters.premiumChapter.concepts[0].title).click();

    // Following user flow: Premium Content → Display 'Premium Content' message → Show 'Upgrade' button
    await expect(page.getByText('Loading concept...')).not.toBeVisible();

    // Verify paywall is displayed
    await expect(page.getByText('Unlock Your Full Potential')).toBeVisible();
    await expect(
      page.getByText(
        `Chapter ${testChapters.premiumChapter.number} - Premium Content`
      )
    ).toBeVisible();

    // Verify value proposition is shown
    await expect(
      page.getByText('Access to all 323 NCLEX concepts')
    ).toBeVisible();

    // Verify pricing information
    await expect(page.getByText('₱2,999')).toBeVisible();

    // Following user flow: Redirect to Subscription Page (via Maya)
    await expect(
      page.getByRole('button', { name: 'Upgrade Now via Maya' })
    ).toBeVisible();

    // Verify trust signal
    await expect(
      page.getByText('🔒 Secure payment processed by Maya Business')
    ).toBeVisible();

    // Test going back to dashboard
    await expect(
      page.getByRole('button', { name: 'Back to Chapters' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Back to Chapters' }).click();
    await expect(page.getByText('Welcome back!')).toBeVisible();
  });

  test('UI correctly displays lock icons and premium badges', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Loading chapters...')).not.toBeVisible();

    // Expand both chapters to check visual indicators
    const freeChapter = page
      .locator(`text=Chapter ${testChapters.freeChapter.number}:`)
      .locator('..');
    const premiumChapter = page
      .locator(`text=Chapter ${testChapters.premiumChapter.number}:`)
      .locator('..');

    // Check for 'Free' chip on free chapter
    await expect(freeChapter.getByText('Free')).toBeVisible();

    // Check for 'Premium' chip on premium chapter
    await expect(premiumChapter.getByText('Premium')).toBeVisible();

    // Expand chapters to see concept-level indicators
    await freeChapter.getByRole('button').click();
    await premiumChapter.getByRole('button').click();

    // Verify premium concept has lock icon and badge
    const premiumConcept = page
      .getByText(testChapters.premiumChapter.concepts[0].title)
      .locator('..');
    await expect(premiumConcept.getByText('Premium')).toBeVisible();
  });
});
